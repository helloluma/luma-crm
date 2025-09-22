import { NextRequest, NextResponse } from 'next/server'
import { GoogleCalendarService } from '@/lib/google-calendar'
import { getUser } from '@/lib/session'

// GET /api/calendar/google/auth - Get Google OAuth authorization URL
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!
    }

    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
      return NextResponse.json({ error: 'Google Calendar integration not configured' }, { status: 500 })
    }

    const googleService = new GoogleCalendarService(config)
    const authUrl = googleService.getAuthUrl()

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating Google auth URL:', error)
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 })
  }
}