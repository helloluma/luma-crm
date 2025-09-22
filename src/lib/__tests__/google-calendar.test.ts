import { GoogleCalendarService, CalendarIntegrationManager } from '../google-calendar'
import { createClient } from '../supabase'

// Mock dependencies
import { vi } from 'vitest'

vi.mock('../supabase')
vi.mock('googleapis')
vi.mock('google-auth-library')

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  gte: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
}

const mockCreateClient = vi.mocked(createClient)
mockCreateClient.mockReturnValue(mockSupabase as any)

describe('GoogleCalendarService', () => {
  const mockConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/callback'
  }

  let service: GoogleCalendarService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new GoogleCalendarService(mockConfig)
  })

  describe('getAuthUrl', () => {
    it('should generate authorization URL', () => {
      const authUrl = service.getAuthUrl()
      
      expect(authUrl).toContain('accounts.google.com')
      expect(authUrl).toContain('client_id=test-client-id')
      expect(authUrl).toContain('scope=')
    })
  })

  describe('appointmentToGoogleEvent', () => {
    it('should convert appointment to Google Calendar event format', () => {
      const appointment = {
        id: 'appointment-1',
        title: 'Property Showing',
        description: 'Show property to client',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        location: '123 Main St',
        client: {
          id: 'client-1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO'
      } as any

      const googleEvent = GoogleCalendarService.appointmentToGoogleEvent(appointment)

      expect(googleEvent).toEqual({
        summary: 'Property Showing',
        description: 'Show property to client',
        start: {
          dateTime: '2024-01-15T10:00:00Z',
          timeZone: 'UTC'
        },
        end: {
          dateTime: '2024-01-15T11:00:00Z',
          timeZone: 'UTC'
        },
        location: '123 Main St',
        attendees: [{
          email: 'john@example.com',
          displayName: 'John Doe'
        }],
        recurrence: ['FREQ=WEEKLY;BYDAY=MO']
      })
    })

    it('should handle appointment without client', () => {
      const appointment = {
        id: 'appointment-1',
        title: 'Internal Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        client: null
      } as any

      const googleEvent = GoogleCalendarService.appointmentToGoogleEvent(appointment)

      expect(googleEvent.attendees).toBeUndefined()
    })
  })

  describe('googleEventToAppointment', () => {
    it('should convert Google Calendar event to appointment format', () => {
      const googleEvent = {
        id: 'google-event-1',
        summary: 'Client Meeting',
        description: 'Discuss contract terms',
        start: {
          dateTime: '2024-01-15T14:00:00Z'
        },
        end: {
          dateTime: '2024-01-15T15:00:00Z'
        },
        location: 'Office',
        status: 'confirmed',
        recurrence: ['FREQ=WEEKLY;BYDAY=TU']
      } as any

      const appointment = GoogleCalendarService.googleEventToAppointment(googleEvent, 'user-1', 'client-1')

      expect(appointment).toEqual({
        title: 'Client Meeting',
        description: 'Discuss contract terms',
        client_id: 'client-1',
        start_time: '2024-01-15T14:00:00Z',
        end_time: '2024-01-15T15:00:00Z',
        location: 'Office',
        type: 'Meeting',
        status: 'Scheduled',
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=TU',
        created_by: 'user-1',
        google_event_id: 'google-event-1',
        google_calendar_id: null
      })
    })

    it('should handle cancelled events', () => {
      const googleEvent = {
        id: 'google-event-1',
        summary: 'Cancelled Meeting',
        start: { dateTime: '2024-01-15T14:00:00Z' },
        end: { dateTime: '2024-01-15T15:00:00Z' },
        status: 'cancelled'
      } as any

      const appointment = GoogleCalendarService.googleEventToAppointment(googleEvent, 'user-1')

      expect(appointment.status).toBe('Cancelled')
    })
  })
})

describe('CalendarIntegrationManager', () => {
  let manager: CalendarIntegrationManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new CalendarIntegrationManager()
  })

  describe('saveIntegration', () => {
    it('should save calendar integration successfully', async () => {
      const integrationData = {
        user_id: 'user-1',
        provider: 'google' as const,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        calendar_id: 'primary',
        calendar_name: 'Primary Calendar',
        sync_enabled: true,
        last_sync: null
      }

      const savedIntegration = { id: 'integration-1', ...integrationData }

      mockSupabase.single.mockResolvedValueOnce({
        data: savedIntegration,
        error: null
      })

      const result = await manager.saveIntegration(integrationData)

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_integrations')
      expect(mockSupabase.insert).toHaveBeenCalledWith(integrationData)
      expect(result).toEqual(savedIntegration)
    })

    it('should handle save errors', async () => {
      const integrationData = {
        user_id: 'user-1',
        provider: 'google' as const,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        calendar_id: 'primary',
        calendar_name: 'Primary Calendar',
        sync_enabled: true,
        last_sync: null
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(manager.saveIntegration(integrationData)).rejects.toThrow('Failed to save calendar integration')
    })
  })

  describe('getIntegration', () => {
    it('should retrieve calendar integration successfully', async () => {
      const integration = {
        id: 'integration-1',
        user_id: 'user-1',
        provider: 'google',
        calendar_name: 'Primary Calendar'
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: integration,
        error: null
      })

      const result = await manager.getIntegration('user-1', 'google')

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_integrations')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('provider', 'google')
      expect(result).toEqual(integration)
    })

    it('should return null when integration not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found error
      })

      const result = await manager.getIntegration('user-1', 'google')

      expect(result).toBeNull()
    })
  })

  describe('createPublicCalendar', () => {
    it('should create public calendar successfully', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

      const publicCalendar = {
        id: 'public-user-1-123456',
        user_id: 'user-1',
        is_active: true
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: publicCalendar,
        error: null
      })

      const result = await manager.createPublicCalendar('user-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('public_calendars')
      expect(result).toContain('http://localhost:3000/calendar/public/')
      expect(result).toContain('public-user-1-')

      delete process.env.NEXT_PUBLIC_APP_URL
    })
  })

  describe('getPublicCalendarAppointments', () => {
    it('should retrieve public calendar appointments successfully', async () => {
      const publicCalendar = {
        user_id: 'user-1',
        is_active: true
      }

      const appointments = [
        {
          id: 'appointment-1',
          title: 'Property Showing',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          type: 'Showing',
          status: 'Scheduled'
        }
      ]

      mockSupabase.single
        .mockResolvedValueOnce({
          data: publicCalendar,
          error: null
        })

      mockSupabase.eq.mockReturnThis()
      mockSupabase.gte.mockReturnThis()
      
      // Mock the appointments query
      const appointmentsQuery = {
        data: appointments,
        error: null
      }
      
      // Reset the mock chain for the second query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue(appointmentsQuery)
              })
            })
          })
        })
      })

      const result = await manager.getPublicCalendarAppointments('public-calendar-1')

      expect(result).toEqual(appointments)
    })

    it('should handle inactive public calendar', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      await expect(manager.getPublicCalendarAppointments('invalid-id')).rejects.toThrow('Public calendar not found or inactive')
    })
  })
})