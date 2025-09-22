import { NextRequest } from 'next/server'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { GET, POST } from '../route'
import { createClient } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(),
}))

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: [],
            error: null,
            count: 0,
          })),
          eq: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({
              data: [],
              error: null,
              count: 0,
            })),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { id: '1', title: 'Test', message: 'Test message' },
          error: null,
        })),
      })),
    })),
  })),
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase)
})

describe('/api/notifications', () => {
  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should fetch notifications for authenticated user', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockNotifications = [
        {
          id: '1',
          title: 'Test Notification',
          message: 'Test message',
          type: 'info',
          read: false,
          created_at: new Date().toISOString(),
        },
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({
                data: mockNotifications,
                error: null,
                count: 1,
              })),
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockNotifications)
      expect(data.count).toBe(1)
    })

    it('should filter unread notifications when unread=true', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockQuery = {
        select: vi.fn(() => mockQuery),
        eq: vi.fn(() => mockQuery),
        order: vi.fn(() => mockQuery),
        range: vi.fn(() => Promise.resolve({
          data: [],
          error: null,
          count: 0,
        })),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/notifications?unread=true')
      await GET(request)

      expect(mockQuery.eq).toHaveBeenCalledWith('read', false)
    })

    it('should filter by type when type parameter is provided', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockQuery = {
        select: vi.fn(() => mockQuery),
        eq: vi.fn(() => mockQuery),
        order: vi.fn(() => mockQuery),
        range: vi.fn(() => Promise.resolve({
          data: [],
          error: null,
          count: 0,
        })),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/notifications?type=warning')
      await GET(request)

      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'warning')
    })
  })

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', message: 'Test message' }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 if title or message is missing', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }), // Missing message
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Title and message are required')
    })

    it('should create notification for authenticated user', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockNotification = {
        id: '1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        read: false,
        user_id: 'user-1',
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockNotification,
              error: null,
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'Test message',
          type: 'info',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data).toEqual(mockNotification)
    })

    it('should require admin role to create notifications for other users', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock profile query to return non-admin user
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { role: 'Assistant' },
                  error: null,
                })),
              })),
            })),
          }
        }
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: null,
              })),
            })),
          })),
        }
      })

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'Test message',
          user_id: 'other-user',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })
  })
})