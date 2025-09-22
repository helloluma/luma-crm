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

describe('/api/calendar/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST', () => {
    it('should sync Google Calendar successfully', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'Admin'
      })

      const mockSyncResults = {
        imported: 5,
        exported: 3,
        errors: []
      }

      const mockInstance = {
        syncWithGoogle: vi.fn().mockResolvedValue(mockSyncResults)
      }
      mockCalendarIntegrationManager.mockImplementation(() => mockInstance as any)

      const request = new NextRequest('http://localhost:3000/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({ provider: 'google' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Calendar sync completed')
      expect(data.results).toEqual(mockSyncResults)
      expect(mockInstance.syncWithGoogle).toHaveBeenCalledWith('user-1')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({ provider: 'google' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid provider', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'Admin'
      })

      const request = new NextRequest('http://localhost:3000/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({ provider: 'invalid' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Valid provider (google or outlook) is required')
    })

    it('should return 501 for Outlook provider', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'Admin'
      })

      const request = new NextRequest('http://localhost:3000/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({ provider: 'outlook' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(501)
      expect(data.error).toBe('Outlook integration not yet implemented')
    })

    it('should handle sync errors gracefully', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'Admin'
      })

      const mockInstance = {
        syncWithGoogle: vi.fn().mockRejectedValue(new Error('Sync failed'))
      }
      mockCalendarIntegrationManager.mockImplementation(() => mockInstance as any)

      const request = new NextRequest('http://localhost:3000/api/calendar/sync', {
        method: 'POST',
        body: JSON.stringify({ provider: 'google' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Sync failed')
    })
  })
})