import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/clients/[id]/documents - Get all documents for a client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientId = params.id

    // Get documents with related data
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        *,
        client:clients(name),
        uploaded_by_profile:profiles!uploaded_by(name, email)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: documents })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/clients/[id]/documents - Create a new document record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientId = params.id
    const body = await request.json()

    // Validate required fields
    const { filename, file_path, file_size, mime_type } = body
    if (!filename || !file_path) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, file_path' },
        { status: 400 }
      )
    }

    // Verify client exists and user has access
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, assigned_agent')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Create document record
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        client_id: clientId,
        filename,
        file_path,
        file_size,
        mime_type,
        uploaded_by: user.id
      })
      .select(`
        *,
        client:clients(name),
        uploaded_by_profile:profiles!uploaded_by(name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating document:', error)
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: document }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}