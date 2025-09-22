import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { createClient } from '@/lib/supabase'
import { AppointmentWithClient } from '@/types'

// Google Calendar API configuration
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
]

export interface GoogleCalendarConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface CalendarIntegration {
  id: string
  user_id: string
  provider: 'google' | 'outlook'
  access_token: string
  refresh_token: string
  calendar_id: string
  calendar_name: string
  sync_enabled: boolean
  last_sync: string | null
  created_at: string
  updated_at: string
}

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  recurrence?: string[]
  status: string
  created: string
  updated: string
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client
  private calendar: any

  constructor(config: GoogleCalendarConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    )
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_CALENDAR_SCOPES,
      prompt: 'consent'
    })
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getAccessToken(code)
    return tokens
  }

  /**
   * Set credentials for the OAuth2 client
   */
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens)
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await this.oauth2Client.refreshAccessToken()
    return credentials
  }

  /**
   * Get user's calendar list
   */
  async getCalendarList() {
    try {
      const response = await this.calendar.calendarList.list()
      return response.data.items || []
    } catch (error) {
      console.error('Error fetching calendar list:', error)
      throw new Error('Failed to fetch calendar list')
    }
  }

  /**
   * Get events from a specific calendar
   */
  async getEvents(calendarId: string, timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250
      })
      
      return response.data.items || []
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      throw new Error('Failed to fetch calendar events')
    }
  }

  /**
   * Create a new event in Google Calendar
   */
  async createEvent(calendarId: string, event: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event
      })
      
      return response.data
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw new Error('Failed to create calendar event')
    }
  }

  /**
   * Update an existing event in Google Calendar
   */
  async updateEvent(calendarId: string, eventId: string, event: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: event
      })
      
      return response.data
    } catch (error) {
      console.error('Error updating calendar event:', error)
      throw new Error('Failed to update calendar event')
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId
      })
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      throw new Error('Failed to delete calendar event')
    }
  }

  /**
   * Convert CRM appointment to Google Calendar event format
   */
  static appointmentToGoogleEvent(appointment: AppointmentWithClient): Partial<GoogleCalendarEvent> {
    return {
      summary: appointment.title,
      description: appointment.description || undefined,
      start: {
        dateTime: appointment.start_time,
        timeZone: 'UTC'
      },
      end: {
        dateTime: appointment.end_time,
        timeZone: 'UTC'
      },
      location: appointment.location || undefined,
      attendees: appointment.client?.email ? [{
        email: appointment.client.email,
        displayName: appointment.client.name
      }] : undefined,
      recurrence: appointment.recurrence_rule ? [appointment.recurrence_rule] : undefined
    }
  }

  /**
   * Convert Google Calendar event to CRM appointment format
   */
  static googleEventToAppointment(event: GoogleCalendarEvent, userId: string, clientId?: string) {
    return {
      title: event.summary,
      description: event.description || null,
      client_id: clientId || null,
      start_time: event.start.dateTime,
      end_time: event.end.dateTime,
      location: event.location || null,
      type: 'Meeting' as const,
      status: event.status === 'confirmed' ? 'Scheduled' as const : 'Cancelled' as const,
      is_recurring: Boolean(event.recurrence && event.recurrence.length > 0),
      recurrence_rule: event.recurrence?.[0] || null,
      created_by: userId,
      google_event_id: event.id,
      google_calendar_id: null // Will be set by the caller
    }
  }
}

/**
 * Calendar Integration Manager
 */
export class CalendarIntegrationManager {
  private supabase = createClient()

  /**
   * Save calendar integration to database
   */
  async saveIntegration(integration: Omit<CalendarIntegration, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('calendar_integrations')
      .insert(integration)
      .select()
      .single()

    if (error) {
      console.error('Error saving calendar integration:', error)
      throw new Error('Failed to save calendar integration')
    }

    return data
  }

  /**
   * Get calendar integration for user
   */
  async getIntegration(userId: string, provider: 'google' | 'outlook'): Promise<CalendarIntegration | null> {
    const { data, error } = await this.supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('sync_enabled', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching calendar integration:', error)
      throw new Error('Failed to fetch calendar integration')
    }

    return data || null
  }

  /**
   * Update calendar integration
   */
  async updateIntegration(id: string, updates: Partial<CalendarIntegration>) {
    const { data, error } = await this.supabase
      .from('calendar_integrations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating calendar integration:', error)
      throw new Error('Failed to update calendar integration')
    }

    return data
  }

  /**
   * Delete calendar integration
   */
  async deleteIntegration(id: string) {
    const { error } = await this.supabase
      .from('calendar_integrations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting calendar integration:', error)
      throw new Error('Failed to delete calendar integration')
    }
  }

  /**
   * Sync appointments with Google Calendar
   */
  async syncWithGoogle(userId: string): Promise<{ imported: number; exported: number; errors: string[] }> {
    const integration = await this.getIntegration(userId, 'google')
    if (!integration) {
      throw new Error('No Google Calendar integration found')
    }

    const config: GoogleCalendarConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!
    }

    const googleService = new GoogleCalendarService(config)
    
    try {
      // Refresh token if needed
      const tokens = await googleService.refreshAccessToken(integration.refresh_token)
      googleService.setCredentials(tokens)

      // Update tokens in database if they were refreshed
      if (tokens.access_token !== integration.access_token) {
        await this.updateIntegration(integration.id, {
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token || integration.refresh_token
        })
      }

      const results = { imported: 0, exported: 0, errors: [] as string[] }

      // Get recent appointments from CRM
      const { data: crmAppointments, error: crmError } = await this.supabase
        .from('appointments')
        .select(`
          *,
          client:clients(id, name, email)
        `)
        .eq('created_by', userId)
        .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .is('google_event_id', null) // Only appointments not yet synced

      if (crmError) {
        results.errors.push(`Failed to fetch CRM appointments: ${crmError.message}`)
      } else if (crmAppointments) {
        // Export CRM appointments to Google Calendar
        for (const appointment of crmAppointments) {
          try {
            const googleEvent = GoogleCalendarService.appointmentToGoogleEvent(appointment)
            const createdEvent = await googleService.createEvent(integration.calendar_id, googleEvent)
            
            // Update appointment with Google event ID
            await this.supabase
              .from('appointments')
              .update({ 
                google_event_id: createdEvent.id,
                google_calendar_id: integration.calendar_id
              })
              .eq('id', appointment.id)

            results.exported++
          } catch (error) {
            results.errors.push(`Failed to export appointment ${appointment.id}: ${error}`)
          }
        }
      }

      // Get recent events from Google Calendar
      const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      
      try {
        const googleEvents = await googleService.getEvents(integration.calendar_id, timeMin, timeMax)
        
        // Import Google Calendar events to CRM
        for (const event of googleEvents) {
          try {
            // Check if event already exists in CRM
            const { data: existingAppointment } = await this.supabase
              .from('appointments')
              .select('id')
              .eq('google_event_id', event.id)
              .single()

            if (!existingAppointment) {
              // Create new appointment from Google event
              const appointmentData = GoogleCalendarService.googleEventToAppointment(event, userId)
              appointmentData.google_calendar_id = integration.calendar_id

              const { error: insertError } = await this.supabase
                .from('appointments')
                .insert(appointmentData)

              if (insertError) {
                results.errors.push(`Failed to import Google event ${event.id}: ${insertError.message}`)
              } else {
                results.imported++
              }
            }
          } catch (error) {
            results.errors.push(`Failed to process Google event ${event.id}: ${error}`)
          }
        }
      } catch (error) {
        results.errors.push(`Failed to fetch Google Calendar events: ${error}`)
      }

      // Update last sync time
      await this.updateIntegration(integration.id, {
        last_sync: new Date().toISOString()
      })

      return results
    } catch (error) {
      console.error('Error during Google Calendar sync:', error)
      throw new Error(`Sync failed: ${error}`)
    }
  }

  /**
   * Create a public calendar sharing URL
   */
  async createPublicCalendar(userId: string): Promise<string> {
    // Generate a unique public calendar ID
    const publicCalendarId = `public-${userId}-${Date.now()}`
    
    const { data, error } = await this.supabase
      .from('public_calendars')
      .insert({
        id: publicCalendarId,
        user_id: userId,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating public calendar:', error)
      throw new Error('Failed to create public calendar')
    }

    return `${process.env.NEXT_PUBLIC_APP_URL}/calendar/public/${publicCalendarId}`
  }

  /**
   * Get public calendar appointments
   */
  async getPublicCalendarAppointments(publicCalendarId: string) {
    // First verify the public calendar exists and is active
    const { data: publicCalendar, error: calendarError } = await this.supabase
      .from('public_calendars')
      .select('user_id, is_active')
      .eq('id', publicCalendarId)
      .eq('is_active', true)
      .single()

    if (calendarError || !publicCalendar) {
      throw new Error('Public calendar not found or inactive')
    }

    // Get appointments for the user (only basic info for privacy)
    const { data: appointments, error } = await this.supabase
      .from('appointments')
      .select('id, title, start_time, end_time, type, status')
      .eq('created_by', publicCalendar.user_id)
      .eq('status', 'Scheduled')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching public calendar appointments:', error)
      throw new Error('Failed to fetch public calendar appointments')
    }

    return appointments || []
  }
}