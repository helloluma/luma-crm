import { NextRequest } from 'next/server'
import { GET } from '../route'
import { CalendarIntegrationManager } from '@/lib/google-calendar'

// Mock dependencies
import { vi } from 'vitest'

vi.mock('@/lib/google-calendar')

const mockCalendarIntegrationManager = vi.mocked(CalendarIntegrationManager, true)

describe('/api/calendar/public/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return public calendar appointments successfully', async () => {
      const mockAppointments = [
        {
          id: 'appointment-1',
          title: 'Property Showing',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          type: 'Showing',
          status: 'Scheduled'
        },
        {
          id: 'appointment-2',
          title: 'Client Meeting',
          start_time: '2024-01-15T14:00:00Z',
          end_time: '2024-01-15T15:00:00Z',
          type: 'Meeting',
          status: 'Scheduled'
        }
      ]

      const mockInstance = {
        getPublicCalendarAppointments: vi.fn().mockResolvedValue(mockAppointments)
      }
      mockCalendarIntegrationManager.mockImplementation(() => mockInstance as any)

      const request = new NextRequest('http://localhost:3000/api/calendar/public/test-calendar-id')
      const response = await GET(request, { params: { id: 'test-calendar-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.appointments).toEqual(mockAppointments)
      expect(mockInstance.getPublicCalendarAppointments).toHaveBeenCalledWith('test-calendar-id')
    })

    it('should return 400 for missing calendar ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/calendar/public/')
      const response = await GET(request, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Calendar ID is required')
    })

    it('should return 500 for calendar not found', async () => {
      const mockInstance = {
        getPublicCalendarAppointments: vi.fn().mockRejectedValue(new Error('Public calendar not found or inactive'))
      }
      mockCalendarIntegrationManager.mockImplementation(() => mockInstance as any)

      const request = new NextRequest('http://localhost:3000/api/calendar/public/invalid-id')
      const response = await GET(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Public calendar not found or inactive')
    })

    it('should handle database errors gracefully', async () => {
      const mockInstance = {
        getPublicCalendarAppointments: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      }
      mockCalendarIntegrationManager.mockImplementation(() => mockInstance as any)

      const request = new NextRequest('http://localhost:3000/api/calendar/public/test-calendar-id')
      const response = await GET(request, { params: { id: 'test-calendar-id' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database connection failed')
    })
  })
})