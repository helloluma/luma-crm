import { NextRequest, NextResponse } from 'next/server'
import { CalendarIntegrationManager } from '@/lib/google-calendar'
import { getUser } from '@/lib/session'

// POST /api/calendar/public - Create a public calendar sharing URL
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integrationManager = new CalendarIntegrationManager()
    const publicUrl = await integrationManager.createPublicCalendar(user.id)

    return NextResponse.json({
      message: 'Public calendar created successfully',
      publicUrl
    })
  } catch (error) {
    console.error('Error creating public calendar:', error)
    return NextResponse.json({ error: 'Failed to create public calendar' }, { status: 500 })
  }
}