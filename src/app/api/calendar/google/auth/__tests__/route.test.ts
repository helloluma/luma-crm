import { NextRequest } from 'next/server'
import { GET } from '../route'
import { getUser } from '@/lib/session'

// Mock dependencies
import { vi } from 'vitest'

vi.mock('@/lib/session')
vi.mock('@/lib/google-calendar')

const mockGetUser = vi.mocked(getUser)

describe('/api/calendar/google/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/calendar/google/callback'
  })

  afterEach(() => {
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET
    delete process.env.GOOGLE_REDIRECT_URI
  })

  describe('GET', () => {
    it('should return authorization URL for authenticated user', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'Admin'
      })

      const request = new NextRequest('http://localhost:3000/api/calendar/google/auth')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('authUrl')
      expect(data.authUrl).toContain('accounts.google.com')
      expect(data.authUrl).toContain('client_id=test-client-id')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/calendar/google/auth')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 500 when Google credentials are not configured', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'Admin'
      })

      delete process.env.GOOGLE_CLIENT_ID

      const request = new NextRequest('http://localhost:3000/api/calendar/google/auth')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Google Calendar integration not configured')
    })
  })
})