import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function DELETE(
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

    const deadlineId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(deadlineId)) {
      return NextResponse.json(
        { error: 'Invalid deadline ID format' },
        { status: 400 }
      )
    }

    // Get the deadline to check permissions
    const { data: deadline, error: fetchError } = await supabase
      .from('client_stage_deadlines')
      .select(`
        *,
        client:clients!client_stage_deadlines_client_id_fkey(
          assigned_agent
        )
      `)
      .eq('id', deadlineId)
      .single()

    if (fetchError || !deadline) {
      return NextResponse.json(
        { error: 'Deadline not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const canDelete = profile?.role === 'SuperAdmin' || 
                     profile?.role === 'Admin' || 
                     deadline.created_by === user.id ||
                     deadline.client?.assigned_agent === user.id

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Delete the deadline
    const { error: deleteError } = await supabase
      .from('client_stage_deadlines')
      .delete()
      .eq('id', deadlineId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete deadline' },
        { status: 500 }
      )
    }

    // Create activity log
    await supabase
      .from('activities')
      .insert({
        type: 'deadline_deleted',
        title: `Deadline deleted for ${deadline.stage} stage`,
        description: `Deadline for ${new Date(deadline.deadline).toLocaleDateString()} was deleted`,
        user_id: user.id,
        entity_type: 'client',
        entity_id: deadline.client_id,
        metadata: {
          stage: deadline.stage,
          deadline: deadline.deadline,
          deleted_deadline_id: deadlineId
        }
      })

    return NextResponse.json({
      message: 'Deadline deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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

    const deadlineId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(deadlineId)) {
      return NextResponse.json(
        { error: 'Invalid deadline ID format' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { deadline: newDeadline, stage } = body

    // Validate deadline
    const deadlineDate = new Date(newDeadline)
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid deadline format' },
        { status: 400 }
      )
    }

    // Validate stage if provided
    if (stage) {
      const validStages = ['Lead', 'Prospect', 'Client', 'Closed']
      if (!validStages.includes(stage)) {
        return NextResponse.json(
          { error: 'Invalid stage value' },
          { status: 400 }
        )
      }
    }

    // Get the existing deadline to check permissions
    const { data: existingDeadline, error: fetchError } = await supabase
      .from('client_stage_deadlines')
      .select(`
        *,
        client:clients!client_stage_deadlines_client_id_fkey(
          assigned_agent
        )
      `)
      .eq('id', deadlineId)
      .single()

    if (fetchError || !existingDeadline) {
      return NextResponse.json(
        { error: 'Deadline not found' },
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
                     existingDeadline.created_by === user.id ||
                     existingDeadline.client?.assigned_agent === user.id

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Update the deadline
    const updateData: any = {
      deadline: deadlineDate.toISOString(),
      updated_at: new Date().toISOString(),
      alert_sent: false, // Reset alert status when deadline changes
      alert_sent_at: null
    }

    if (stage) {
      updateData.stage = stage
    }

    const { data: updatedDeadline, error: updateError } = await supabase
      .from('client_stage_deadlines')
      .update(updateData)
      .eq('id', deadlineId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update deadline' },
        { status: 500 }
      )
    }

    // Create activity log
    await supabase
      .from('activities')
      .insert({
        type: 'deadline_updated',
        title: `Deadline updated for ${updatedDeadline.stage} stage`,
        description: `Deadline updated to ${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString()}`,
        user_id: user.id,
        entity_type: 'client',
        entity_id: updatedDeadline.client_id,
        metadata: {
          stage: updatedDeadline.stage,
          old_deadline: existingDeadline.deadline,
          new_deadline: updatedDeadline.deadline
        }
      })

    return NextResponse.json({
      data: updatedDeadline,
      message: 'Deadline updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}