import { NextRequest, NextResponse } from 'next/server'
import { CalendarIntegrationManager } from '@/lib/google-calendar'
import { getUser } from '@/lib/session'

// GET /api/calendar/integrations - Get user's calendar integrations
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as 'google' | 'outlook' | null

    const integrationManager = new CalendarIntegrationManager()
    
    if (provider) {
      const integration = await integrationManager.getIntegration(user.id, provider)
      return NextResponse.json({ integration })
    } else {
      // Get all integrations for the user
      const googleIntegration = await integrationManager.getIntegration(user.id, 'google')
      const outlookIntegration = await integrationManager.getIntegration(user.id, 'outlook')
      
      return NextResponse.json({ 
        integrations: {
          google: googleIntegration,
          outlook: outlookIntegration
        }
      })
    }
  } catch (error) {
    console.error('Error fetching calendar integrations:', error)
    return NextResponse.json({ error: 'Failed to fetch calendar integrations' }, { status: 500 })
  }
}

// DELETE /api/calendar/integrations - Delete calendar integration
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as 'google' | 'outlook'

    if (!provider) {
      return NextResponse.json({ error: 'Provider parameter is required' }, { status: 400 })
    }

    const integrationManager = new CalendarIntegrationManager()
    const integration = await integrationManager.getIntegration(user.id, provider)
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    await integrationManager.deleteIntegration(integration.id)

    return NextResponse.json({ message: 'Calendar integration deleted successfully' })
  } catch (error) {
    console.error('Error deleting calendar integration:', error)
    return NextResponse.json({ error: 'Failed to delete calendar integration' }, { status: 500 })
  }
}