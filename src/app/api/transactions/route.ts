import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createTransactionSchema, transactionFiltersSchema } from '@/lib/validations/transaction'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = transactionFiltersSchema.parse({
      status: searchParams.get('status')?.split(','),
      client_id: searchParams.get('client_id') || undefined,
      price_min: searchParams.get('price_min') ? Number(searchParams.get('price_min')) : undefined,
      price_max: searchParams.get('price_max') ? Number(searchParams.get('price_max')) : undefined,
      closing_date_from: searchParams.get('closing_date_from') || undefined,
      closing_date_to: searchParams.get('closing_date_to') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
      sort_by: searchParams.get('sort_by') as any || 'created_at',
      sort_order: searchParams.get('sort_order') as any || 'desc',
    })

    const supabase = createClient()
    
    // Build the query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        client:clients(
          id,
          name,
          email,
          type
        )
      `)

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id)
    }

    if (filters.price_min) {
      query = query.gte('price', filters.price_min)
    }

    if (filters.price_max) {
      query = query.lte('price', filters.price_max)
    }

    if (filters.closing_date_from) {
      query = query.gte('closing_date', filters.closing_date_from)
    }

    if (filters.closing_date_to) {
      query = query.lte('closing_date', filters.closing_date_to)
    }

    if (filters.search) {
      query = query.or(`address.ilike.%${filters.search}%`)
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)

    const { data: transactions, error, count } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const totalPages = count ? Math.ceil(count / filters.limit) : 0

    return NextResponse.json({
      data: transactions,
      count,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    })
  } catch (error) {
    console.error('Error in GET /api/transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTransactionSchema.parse(body)

    const supabase = createClient()

    // Verify the client exists and user has access
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, assigned_agent')
      .eq('id', validatedData.client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if user has permission to create transactions for this client
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const isAuthorized = 
      client.assigned_agent === session.user.id ||
      profile?.role === 'SuperAdmin' ||
      profile?.role === 'Admin'

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Calculate commission if not provided
    const transactionData = {
      ...validatedData,
      net_commission: validatedData.net_commission ?? calculateNetCommission(
        validatedData.price,
        validatedData.commission_rate,
        validatedData.broker_commission
      ),
      broker_commission: validatedData.broker_commission ?? calculateBrokerCommission(
        validatedData.price,
        validatedData.commission_rate
      ),
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(transactionData)
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
      console.error('Error creating transaction:', error)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    return NextResponse.json({ data: transaction }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/transactions:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
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