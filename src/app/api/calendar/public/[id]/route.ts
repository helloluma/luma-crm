import { NextRequest, NextResponse } from 'next/server'
import { CalendarIntegrationManager } from '@/lib/google-calendar'

// GET /api/calendar/public/[id] - Get public calendar appointments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const publicCalendarId = params.id

    if (!publicCalendarId) {
      return NextResponse.json({ error: 'Calendar ID is required' }, { status: 400 })
    }

    const integrationManager = new CalendarIntegrationManager()
    const appointments = await integrationManager.getPublicCalendarAppointments(publicCalendarId)

    // Transform appointments to only include public information
    const publicAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      type: appointment.type,
      status: appointment.status
    }))

    return NextResponse.json({
      appointments: publicAppointments
    })
  } catch (error) {
    console.error('Error fetching public calendar:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch public calendar' 
    }, { status: 500 })
  }
}