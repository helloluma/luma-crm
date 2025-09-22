import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import type { ClientUpdate } from '@/types'

// GET /api/clients/[id] - Get a specific client by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 })
    }

    // Fetch client with related data
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        assigned_agent_profile:profiles!clients_assigned_agent_fkey(
          id,
          name,
          email,
          avatar_url
        ),
        documents(
          id,
          filename,
          file_size,
          mime_type,
          created_at,
          uploaded_by_profile:profiles!documents_uploaded_by_fkey(
            id,
            name
          )
        ),
        transactions(
          id,
          address,
          price,
          commission_rate,
          gross_commission,
          net_commission,
          status,
          closing_date,
          created_at
        ),
        appointments(
          id,
          title,
          start_time,
          end_time,
          location,
          type,
          status,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      console.error('Error fetching client:', error)
      return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
    }

    return NextResponse.json({ data: client })
  } catch (error) {
    console.error('Unexpected error in GET /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/clients/[id] - Update a specific client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields if provided
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }

    if (body.email !== undefined) {
      if (!body.email.trim()) {
        return NextResponse.json({ error: 'Email cannot be empty' }, { status: 400 })
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
    }

    // Validate client type
    if (body.type !== undefined) {
      const validTypes = ['Lead', 'Prospect', 'Client', 'Closed']
      if (!validTypes.includes(body.type)) {
        return NextResponse.json({ error: 'Invalid client type' }, { status: 400 })
      }
    }

    // Validate budget range
    if (body.budget_min !== undefined && body.budget_max !== undefined) {
      if (body.budget_min > body.budget_max) {
        return NextResponse.json(
          { error: 'Minimum budget cannot be greater than maximum budget' },
          { status: 400 }
        )
      }
    }

    // Check if client exists and user has permission
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, email')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      console.error('Error fetching client for update:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
    }

    // Check for duplicate email if email is being updated
    if (body.email && body.email.toLowerCase().trim() !== existingClient.email) {
      const { data: duplicateClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', body.email.toLowerCase().trim())
        .neq('id', id)
        .single()

      if (duplicateClient) {
        return NextResponse.json(
          { error: 'A client with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: ClientUpdate = {}
    
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.email !== undefined) updateData.email = body.email.toLowerCase().trim()
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null
    if (body.type !== undefined) updateData.type = body.type
    if (body.source !== undefined) updateData.source = body.source?.trim() || null
    if (body.budget_min !== undefined) updateData.budget_min = body.budget_min || null
    if (body.budget_max !== undefined) updateData.budget_max = body.budget_max || null
    if (body.preferred_area !== undefined) updateData.preferred_area = body.preferred_area?.trim() || null
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null
    if (body.assigned_agent !== undefined) updateData.assigned_agent = body.assigned_agent
    if (body.last_contact !== undefined) updateData.last_contact = body.last_contact

    // Update client
    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
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
      console.error('Error updating client:', error)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json({ data: client })
  } catch (error) {
    console.error('Unexpected error in PUT /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/clients/[id] - Delete a specific client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 })
    }

    // Check if client exists and user has permission
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      console.error('Error fetching client for deletion:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
    }

    // Check for related records that would prevent deletion
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('client_id', id)
      .limit(1)

    if (transactions && transactions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with existing transactions' },
        { status: 409 }
      )
    }

    // Delete client (this will cascade to related documents and appointments)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}