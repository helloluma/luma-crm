import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { updateTransactionSchema } from '@/lib/validations/transaction'
import { getSession } from '@/lib/session'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        client:clients(
          id,
          name,
          email,
          phone,
          type,
          assigned_agent
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching transaction:', error)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Check if user has permission to view this transaction
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const isAuthorized = 
      transaction.client?.assigned_agent === session.user.id ||
      profile?.role === 'SuperAdmin' ||
      profile?.role === 'Admin'

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    return NextResponse.json({ data: transaction })
  } catch (error) {
    console.error('Error in GET /api/transactions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateTransactionSchema.parse(body)

    const supabase = createClient()

    // First, get the current transaction to check permissions
    const { data: currentTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        *,
        client:clients(
          id,
          assigned_agent
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !currentTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const isAuthorized = 
      currentTransaction.client?.assigned_agent === session.user.id ||
      profile?.role === 'SuperAdmin' ||
      profile?.role === 'Admin'

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Recalculate commissions if price or commission rate changed
    const updateData = { ...validatedData }
    
    if (validatedData.price !== undefined || validatedData.commission_rate !== undefined) {
      const price = validatedData.price ?? currentTransaction.price
      const commissionRate = validatedData.commission_rate ?? currentTransaction.commission_rate
      
      if (!updateData.net_commission) {
        updateData.net_commission = calculateNetCommission(
          price,
          commissionRate,
          updateData.broker_commission ?? currentTransaction.broker_commission
        )
      }
      
      if (!updateData.broker_commission) {
        updateData.broker_commission = calculateBrokerCommission(price, commissionRate)
      }
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        client:clients(
          id,
          name,
          email,
          type
        )
      `)
      .single()

    if (error) {
      console.error('Error updating transaction:', error)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    return NextResponse.json({ data: transaction })
  } catch (error) {
    console.error('Error in PUT /api/transactions/[id]:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Check if user has permission to delete transactions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'SuperAdmin' && profile?.role !== 'Admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting transaction:', error)
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/transactions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions for commission calculations
function calculateNetCommission(price: number, commissionRate: number, brokerCommission?: number | null): number {
  const grossCommission = (price * commissionRate) / 100
  const brokerAmount = brokerCommission ?? calculateBrokerCommission(price, commissionRate)
  return grossCommission - brokerAmount
}

function calculateBrokerCommission(price: number, commissionRate: number, brokerSplit: number = 20): number {
  const grossCommission = (price * commissionRate) / 100
  return (grossCommission * brokerSplit) / 100
}