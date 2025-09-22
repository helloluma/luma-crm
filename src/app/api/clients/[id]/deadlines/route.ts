import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

interface CreateDeadlineRequest {
  stage: 'Lead' | 'Prospect' | 'Client' | 'Closed'
  deadline: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const clientId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID format' },
        { status: 400 }
      )
    }

    // Fetch deadlines for this client
    const { data: deadlines, error } = await supabase
      .from('client_stage_deadlines')
      .select(`
        *,
        created_by_profile:profiles!client_stage_deadlines_created_by_fkey(
          name,
          avatar_url
        )
      `)
      .eq('client_id', clientId)
      .order('deadline', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch deadlines' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: deadlines || [],
      message: 'Deadlines retrieved successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const clientId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID format' },
        { status: 400 }
      )
    }

    // Parse request body
    const body: CreateDeadlineRequest = await request.json()
    const { stage, deadline } = body

    // Validate stage
    const validStages = ['Lead', 'Prospect', 'Client', 'Closed']
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage value' },
        { status: 400 }
      )
    }

    // Validate deadline
    const deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid deadline format' },
        { status: 400 }
      )
    }

    // Check if client exists and user has permission
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('assigned_agent')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const canUpdate = profile?.role === 'SuperAdmin' || 
                     profile?.role === 'Admin' || 
                     client.assigned_agent === user.id

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Insert or update deadline
    const { data: newDeadline, error: insertError } = await supabase
      .from('client_stage_deadlines')
      .upsert({
        client_id: clientId,
        stage,
        deadline: deadlineDate.toISOString(),
        created_by: user.id,
        alert_sent: false
      }, {
        onConflict: 'client_id,stage'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create deadline' },
        { status: 500 }
      )
    }

    // Create activity log
    await supabase
      .from('activities')
      .insert({
        type: 'deadline_set',
        title: `Deadline set for ${stage} stage`,
        description: `Deadline set for ${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString()}`,
        user_id: user.id,
        entity_type: 'client',
        entity_id: clientId,
        metadata: {
          stage,
          deadline: deadlineDate.toISOString()
        }
      })

    return NextResponse.json({
      data: newDeadline,
      message: 'Deadline created successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}