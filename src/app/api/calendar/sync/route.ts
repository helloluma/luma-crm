import { NextRequest, NextResponse } from 'next/server'
import { CalendarIntegrationManager } from '@/lib/google-calendar'
import { getUser } from '@/lib/session'

// POST /api/calendar/sync - Sync appointments with external calendars
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider } = body

    if (!provider || !['google', 'outlook'].includes(provider)) {
      return NextResponse.json({ error: 'Valid provider (google or outlook) is required' }, { status: 400 })
    }

    const integrationManager = new CalendarIntegrationManager()

    let syncResults
    if (provider === 'google') {
      syncResults = await integrationManager.syncWithGoogle(user.id)
    } else {
      // Outlook integration would be implemented here
      return NextResponse.json({ error: 'Outlook integration not yet implemented' }, { status: 501 })
    }

    return NextResponse.json({
      message: 'Calendar sync completed',
      results: syncResults
    })
  } catch (error) {
    console.error('Error syncing calendar:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to sync calendar' 
    }, { status: 500 })
  }
}