import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { csvTransactionSchema } from '@/lib/validations/transaction'
import { z } from 'zod'

// Schema for the import request
const importRequestSchema = z.object({
  transactions: z.array(csvTransactionSchema.extend({
    client_id: z.string().uuid()
  }))
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { transactions } = importRequestSchema.parse(body)

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions to import' },
        { status: 400 }
      )
    }

    // Validate that all clients exist
    const clientIds = [...new Set(transactions.map(t => t.client_id))]
    const { data: existingClients, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .in('id', clientIds)

    if (clientError) {
      console.error('Error checking clients:', clientError)
      return NextResponse.json(
        { error: 'Failed to validate clients' },
        { status: 500 }
      )
    }

    const existingClientIds = new Set(existingClients?.map(c => c.id) || [])
    const missingClients = clientIds.filter(id => !existingClientIds.has(id))

    if (missingClients.length > 0) {
      return NextResponse.json(
        { error: `Clients not found: ${missingClients.join(', ')}` },
        { status: 400 }
      )
    }

    // Prepare transactions for database insertion
    const transactionsToInsert = transactions.map(transaction => {
      // Calculate gross commission if not provided
      const grossCommission = transaction.gross_commission || 
        (transaction.price * transaction.commission_rate / 100)

      return {
        address: transaction.address,
        client_id: transaction.client_id,
        price: transaction.price,
        commission_rate: transaction.commission_rate,
        net_commission: transaction.net_commission,
        broker_commission: transaction.broker_commission,
        status: transaction.status || 'Active',
        closing_date: transaction.closing_date || null,
        created_by: user.id
      }
    })

    // Insert transactions in batches to avoid timeout
    const batchSize = 50
    const results = []
    
    for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
      const batch = transactionsToInsert.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(batch)
        .select(`
          *,
          client:clients(*)
        `)

      if (error) {
        console.error('Error inserting batch:', error)
        return NextResponse.json(
          { error: `Failed to import transactions: ${error.message}` },
          { status: 500 }
        )
      }

      results.push(...(data || []))
    }

    // Log the import activity
    await supabase
      .from('activities')
      .insert({
        type: 'transaction_import',
        title: 'Transactions Imported',
        description: `Imported ${results.length} transactions from CSV`,
        user_id: user.id,
        metadata: {
          imported_count: results.length,
          import_timestamp: new Date().toISOString()
        }
      })

    return NextResponse.json({
      message: `Successfully imported ${results.length} transactions`,
      imported: results.length,
      transactions: results
    })

  } catch (error) {
    console.error('Import error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid data format',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}