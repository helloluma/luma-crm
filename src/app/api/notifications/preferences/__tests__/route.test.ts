import { NextRequest } from 'next/server'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { GET, PUT } from '../route'
import { createClient } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(),
}))

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  rpc: vi.fn(),
  from: vi.fn(() => ({
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { id: '1', user_id: 'user-1' },
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

describe('/api/notifications/preferences', () => {
  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should fetch notification preferences successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockPreferences = {
        id: '1',
        user_id: 'user-1',
        email_new_leads: true,
        email_appointment_reminders: true,
        sms_urgent_deadlines: false,
        phone_number: '+1234567890'
      }

      mockSupabase.rpc.mockResolvedValue({
        data: mockPreferences,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockPreferences)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_or_create_notification_preferences', {
        p_user_id: 'user-1'
      })
    })

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch notification preferences')
    })
  })

  describe('PUT', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ email_new_leads: false }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should update notification preferences successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const updatedPreferences = {
        id: '1',
        user_id: 'user-1',
        email_new_leads: false,
        email_appointment_reminders: true,
        phone_number: '+1234567890'
      }

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: updatedPreferences,
              error: null,
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          email_new_leads: false,
          email_appointment_reminders: true,
          phone_number: '+1234567890'
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(updatedPreferences)
    })

    it('should validate email frequency', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          email_frequency: 'invalid-frequency'
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email frequency. Must be one of: immediate, hourly, daily, weekly')
    })

    it('should validate SMS frequency', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          sms_frequency: 'invalid-frequency'
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid SMS frequency. Must be one of: immediate, urgent_only')
    })

    it('should require phone number when SMS notifications are enabled', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          sms_urgent_deadlines: true,
          phone_number: '' // Empty phone number
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Phone number is required when SMS notifications are enabled')
    })

    it('should handle database errors during update', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: new Error('Database error'),
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ email_new_leads: false }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update notification preferences')
    })
  })
})