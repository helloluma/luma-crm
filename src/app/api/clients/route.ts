import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import type { ClientInsert, ClientFilters } from '@/types'

// GET /api/clients - Get all clients with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const assignedAgent = searchParams.get('assignedAgent')
    const source = searchParams.get('source')

    // Build query
    let query = supabase
      .from('clients')
      .select(`
        *,
        assigned_agent_profile:profiles!clients_assigned_agent_fkey(
          id,
          name,
          email,
          avatar_url
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (assignedAgent) {
      query = query.eq('assigned_agent', assignedAgent)
    }

    if (source) {
      query = query.ilike('source', `%${source}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Order by created_at desc
    query = query.order('created_at', { ascending: false })

    const { data: clients, error, count } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: clients,
      count: count || 0,
      page,
      limit,
      totalPages
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate client type
    const validTypes = ['Lead', 'Prospect', 'Client', 'Closed']
    if (body.type && !validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid client type' },
        { status: 400 }
      )
    }

    // Validate budget range
    if (body.budget_min && body.budget_max && body.budget_min > body.budget_max) {
      return NextResponse.json(
        { error: 'Minimum budget cannot be greater than maximum budget' },
        { status: 400 }
      )
    }

    // Prepare client data
    const clientData: ClientInsert = {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone?.trim() || null,
      type: body.type || 'Lead',
      source: body.source?.trim() || null,
      budget_min: body.budget_min || null,
      budget_max: body.budget_max || null,
      preferred_area: body.preferred_area?.trim() || null,
      notes: body.notes?.trim() || null,
      assigned_agent: body.assigned_agent || user.id,
      last_contact: null
    }

    // Check for duplicate email
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', clientData.email)
      .single()

    if (existingClient) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 409 }
      )
    }

    // Insert client
    const { data: client, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select(`
        *,
        assigned_agent_profile:profiles!clients_assigned_agent_fkey(
          id,
          name,
          email,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }

    return NextResponse.json({ data: client }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}