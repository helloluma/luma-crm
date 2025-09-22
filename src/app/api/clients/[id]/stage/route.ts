import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

interface UpdateStageRequest {
  stage: 'Lead' | 'Prospect' | 'Client' | 'Closed'
  notes?: string
  deadline?: string
}

export async function PUT(
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
    const body: UpdateStageRequest = await request.json()
    const { stage, notes, deadline } = body

    // Validate stage
    const validStages = ['Lead', 'Prospect', 'Client', 'Closed']
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage value' },
        { status: 400 }
      )
    }

    // Get current client data
    const { data: currentClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (fetchError || !currentClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to update this client
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const canUpdate = profile?.role === 'SuperAdmin' || 
                     profile?.role === 'Admin' || 
                     currentClient.assigned_agent === user.id

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Update client stage
    const updateData: any = {
      type: stage,
      stage_notes: notes || null,
      stage_deadline: deadline || null,
      updated_at: new Date().toISOString()
    }

    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update client stage' },
        { status: 500 }
      )
    }

    // Set default deadline if not provided and stage is not Closed
    if (!deadline && stage !== 'Closed') {
      const { error: deadlineError } = await supabase
        .rpc('set_default_stage_deadline', {
          p_client_id: clientId,
          p_stage: stage,
          p_created_by: user.id
        })

      if (deadlineError) {
        console.error('Deadline error:', deadlineError)
        // Don't fail the request, just log the error
      }
    }

    // Create activity log
    await supabase
      .from('activities')
      .insert({
        type: 'client_stage_change',
        title: `Client stage updated to ${stage}`,
        description: notes || `Client ${currentClient.name} moved from ${currentClient.type} to ${stage}`,
        user_id: user.id,
        entity_type: 'client',
        entity_id: clientId,
        metadata: {
          from_stage: currentClient.type,
          to_stage: stage,
          client_name: currentClient.name
        }
      })

    return NextResponse.json({
      data: updatedClient,
      message: 'Client stage updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}