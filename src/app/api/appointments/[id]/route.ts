import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { updateAppointmentSchema } from '@/lib/validations/appointment'
import { getUser } from '@/lib/session'

// GET /api/appointments/[id] - Get a specific appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(id, name, email, phone),
        created_by_profile:profiles!appointments_created_by_fkey(id, name, email),
        parent_appointment:appointments!appointments_parent_appointment_id_fkey(id, title, start_time),
        recurring_instances:appointments!appointments_parent_appointment_id_fkey(id, title, start_time, end_time, status)
      `)
      .eq('id', params.id)
      .eq('created_by', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }
      console.error('Error fetching appointment:', error)
      return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 })
    }

    return NextResponse.json({ data: appointment })
  } catch (error) {
    console.error('Error in GET /api/appointments/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/appointments/[id] - Update a specific appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateAppointmentSchema.parse({ ...body, id: params.id })

    const supabase = createClient()

    // First check if the appointment exists and belongs to the user
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, created_by, is_recurring, parent_appointment_id')
      .eq('id', params.id)
      .eq('created_by', user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }
      console.error('Error fetching appointment for update:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 })
    }

    // Prepare update data
    const { id, ...updateData } = validatedData
    const appointmentUpdate = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    // Handle recurring appointment updates
    if (body.updateRecurringSeries && existingAppointment.is_recurring) {
      // Update all instances in the recurring series
      const parentId = existingAppointment.parent_appointment_id || existingAppointment.id
      
      const { error: updateError } = await supabase
        .from('appointments')
        .update(appointmentUpdate)
        .or(`id.eq.${parentId},parent_appointment_id.eq.${parentId}`)

      if (updateError) {
        console.error('Error updating recurring series:', updateError)
        return NextResponse.json({ error: 'Failed to update recurring series' }, { status: 500 })
      }
    } else {
      // Update only this specific appointment
      const { error: updateError } = await supabase
        .from('appointments')
        .update(appointmentUpdate)
        .eq('id', params.id)

      if (updateError) {
        console.error('Error updating appointment:', updateError)
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
      }
    }

    // Fetch the updated appointment
    const { data: updatedAppointment, error: refetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(id, name, email),
        created_by_profile:profiles!appointments_created_by_fkey(id, name, email)
      `)
      .eq('id', params.id)
      .single()

    if (refetchError) {
      console.error('Error refetching updated appointment:', refetchError)
      return NextResponse.json({ error: 'Failed to fetch updated appointment' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedAppointment })
  } catch (error) {
    console.error('Error in PUT /api/appointments/[id]:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/appointments/[id] - Delete a specific appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deleteRecurringSeries = searchParams.get('deleteRecurringSeries') === 'true'

    const supabase = createClient()

    // First check if the appointment exists and belongs to the user
    const { data: existingAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, created_by, is_recurring, parent_appointment_id')
      .eq('id', params.id)
      .eq('created_by', user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }
      console.error('Error fetching appointment for deletion:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 })
    }

    if (deleteRecurringSeries && existingAppointment.is_recurring) {
      // Delete all instances in the recurring series
      const parentId = existingAppointment.parent_appointment_id || existingAppointment.id
      
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .or(`id.eq.${parentId},parent_appointment_id.eq.${parentId}`)

      if (deleteError) {
        console.error('Error deleting recurring series:', deleteError)
        return NextResponse.json({ error: 'Failed to delete recurring series' }, { status: 500 })
      }
    } else {
      // Delete only this specific appointment
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', params.id)

      if (deleteError) {
        console.error('Error deleting appointment:', deleteError)
        return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 })
      }
    }

    return NextResponse.json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/appointments/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}