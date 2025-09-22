import { NextRequest } from 'next/server'
import { POST } from '../route'
import { getUser } from '@/lib/session'
import { CalendarIntegrationManager } from '@/lib/google-calendar'

// Mock dependencies
import { vi } from 'vitest'

vi.mock('@/lib/session')
vi.mock('@/lib/google-calendar')

const mockGetUser = vi.mocked(getUser)
const mockCalendarIntegrationManager = vi.mocked(CalendarIntegrationManager, true)

describe('/api/calendar/public', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  describe('POST', () => {
    it('should create public calendar successfully', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'Admin'
      })

      const mockPublicUrl = 'http://localhost:3000/calendar/public/public-user-1-1234567890'

      const mockInstance = {
        createPublicCalendar: vi.fn().mockResolvedValue(mockPublicUrl)
      }
      mockCalendarIntegrationManager.mockImplementation(() => mockInstance as any)

      const request = new NextRequest('http://localhost:3000/api/calendar/public', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Public calendar created successfully')
      expect(data.publicUrl).toBe(mockPublicUrl)
      expect(mockInstance.createPublicCalendar).toHaveBeenCalledWith('user-1')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/calendar/public', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle creation errors gracefully', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'Admin'
      })

      const mockInstance = {
        createPublicCalendar: vi.fn().mockRejectedValue(new Error('Database error'))
      }
      mockCalendarIntegrationManager.mockImplementation(() => mockInstance as any)

      const request = new NextRequest('http://localhost:3000/api/calendar/public', {
        method: 'POST'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create public calendar')
    })
  })
})