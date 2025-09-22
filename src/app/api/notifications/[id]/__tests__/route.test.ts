import { NextRequest } from 'next/server'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { PATCH, DELETE } from '../route'
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
        single: vi.fn(() => Promise.resolve({
          data: { user_id: 'user-1' },
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: '1', read: true },
            error: null,
          })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase)
})

describe('/api/notifications/[id]', () => {
  describe('PATCH', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/1', {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      })
      const response = await PATCH(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 if notification is not found', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: new Error('Not found'),
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/1', {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      })
      const response = await PATCH(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Notification not found')
    })

    it('should return 403 if notification belongs to different user', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { user_id: 'other-user' },
              error: null,
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/1', {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      })
      const response = await PATCH(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized')
    })

    it('should update notification successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockNotification = { id: '1', read: true, user_id: 'user-1' }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'notifications') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { user_id: 'user-1' },
                  error: null,
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: mockNotification,
                    error: null,
                  })),
                })),
              })),
            })),
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/1', {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      })
      const response = await PATCH(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockNotification)
    })
  })

  describe('DELETE', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should delete notification successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'notifications') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { user_id: 'user-1' },
                  error: null,
                })),
              })),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Notification deleted successfully')
    })
  })
})