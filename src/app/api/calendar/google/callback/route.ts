import { NextRequest, NextResponse } from 'next/server'
import { GoogleCalendarService, CalendarIntegrationManager } from '@/lib/google-calendar'
import { getUser } from '@/lib/session'

// GET /api/calendar/google/callback - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.json({ error: `OAuth error: ${error}` }, { status: 400 })
    }

    if (!code) {
      return NextResponse.json({ error: 'Authorization code not provided' }, { status: 400 })
    }

    const config = {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!
    }

    const googleService = new GoogleCalendarService(config)
    const tokens = await googleService.getTokens(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json({ error: 'Failed to obtain access tokens' }, { status: 400 })
    }

    // Set credentials and get calendar list
    googleService.setCredentials(tokens)
    const calendars = await googleService.getCalendarList()
    
    // Find primary calendar or use the first available
    const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0]
    
    if (!primaryCalendar) {
      return NextResponse.json({ error: 'No calendars found' }, { status: 400 })
    }

    // Save integration to database
    const integrationManager = new CalendarIntegrationManager()
    
    // Check if integration already exists
    const existingIntegration = await integrationManager.getIntegration(user.id, 'google')
    
    if (existingIntegration) {
      // Update existing integration
      const updatedIntegration = await integrationManager.updateIntegration(existingIntegration.id, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        calendar_id: primaryCalendar.id,
        calendar_name: primaryCalendar.summary || 'Primary Calendar',
        sync_enabled: true
      })
      
      return NextResponse.json({ 
        message: 'Google Calendar integration updated successfully',
        integration: updatedIntegration
      })
    } else {
      // Create new integration
      const newIntegration = await integrationManager.saveIntegration({
        user_id: user.id,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        calendar_id: primaryCalendar.id,
        calendar_name: primaryCalendar.summary || 'Primary Calendar',
        sync_enabled: true,
        last_sync: null
      })

      return NextResponse.json({ 
        message: 'Google Calendar integration created successfully',
        integration: newIntegration
      })
    }
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error)
    return NextResponse.json({ error: 'Failed to complete Google Calendar integration' }, { status: 500 })
  }
}