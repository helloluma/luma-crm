import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { createClient } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn()
}))

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({}))
}))

// Mock console.log to avoid noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})

describe('/api/deadlines/check', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    gte: vi.fn(() => mockSupabase),
    lte: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    single: vi.fn(),
    // Add missing methods for chaining
    where: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase)
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com'
  }

  const mockAdminProfile = {
    id: 'user-1',
    role: 'Admin'
  }

  const mockUpcomingDeadlines = [
    {
      id: 'deadline-1',
      client_id: 'client-1',
      stage: 'Prospect',
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      alert_sent: false,
      alert_sent_at: null,
      created_by: 'user-1',
      client: {
        id: 'client-1',
        name: 'John Doe',
        type: 'Prospect',
        assigned_agent: 'user-1',
        assigned_agent_profile: {
          name: 'Agent Smith',
          email: 'agent@example.com'
        }
      }
    },
    {
      id: 'deadline-2',
      client_id: 'client-2',
      stage: 'Client',
      deadline: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(), // 23 hours from now
      alert_sent: false,
      alert_sent_at: null,
      created_by: 'user-1',
      client: {
        id: 'client-2',
        name: 'Jane Smith',
        type: 'Client',
        assigned_agent: 'user-2',
        assigned_agent_profile: {
          name: 'Agent Jones',
          email: 'jones@example.com'
        }
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/deadlines/check', () => {
    it('processes upcoming deadlines and creates notifications', async () => {
      mockSupabase.eq.mockResolvedValue({
        data: mockUpcomingDeadlines,
        error: null
      })

      mockSupabase.update.mockResolvedValue({
        data: null,
        error: null
      })

      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check', {
        method: 'POST'
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.message).toBe('Deadline check completed')
      expect(data.data.deadlines_processed).toBe(2)
      expect(data.data.notifications_created).toBe(2)
      expect(data.data.emails_queued).toBe(2)

      // Should have updated deadlines to mark alerts as sent
      expect(mockSupabase.update).toHaveBeenCalledTimes(2)
      
      // Should have created notifications
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'user-1',
          title: 'Prospect Stage Deadline Approaching',
          type: 'error' // 2 hours = critical
        }),
        expect.objectContaining({
          user_id: 'user-2',
          title: 'Client Stage Deadline Approaching',
          type: 'warning' // 23 hours = medium
        })
      ])
    })

    it('handles case with no upcoming deadlines', async () => {
      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check', {
        method: 'POST'
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.data.deadlines_processed).toBe(0)
      expect(data.data.notifications_created).toBe(0)
      expect(data.data.emails_queued).toBe(0)

      // Should not create any notifications or activity logs
      expect(mockSupabase.insert).not.toHaveBeenCalled()
    })

    it('determines correct urgency levels', async () => {
      const now = new Date()
      const testDeadlines = [
        {
          ...mockUpcomingDeadlines[0],
          deadline: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString() // 1 hour = critical
        },
        {
          ...mockUpcomingDeadlines[1],
          deadline: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString() // 4 hours = high
        }
      ]

      mockSupabase.eq.mockResolvedValue({
        data: testDeadlines,
        error: null
      })

      mockSupabase.update.mockResolvedValue({ data: null, error: null })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check', {
        method: 'POST'
      })
      await POST(request)

      // Check that notifications were created with correct urgency
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'error', // critical
          metadata: expect.objectContaining({
            urgency: 'critical'
          })
        }),
        expect.objectContaining({
          type: 'error', // high
          metadata: expect.objectContaining({
            urgency: 'high'
          })
        })
      ])
    })

    it('skips notifications for deadlines without assigned agents', async () => {
      const deadlineWithoutAgent = {
        ...mockUpcomingDeadlines[0],
        client: {
          ...mockUpcomingDeadlines[0].client,
          assigned_agent: null,
          assigned_agent_profile: null
        }
      }

      mockSupabase.eq.mockResolvedValue({
        data: [deadlineWithoutAgent],
        error: null
      })

      mockSupabase.update.mockResolvedValue({ data: null, error: null })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check', {
        method: 'POST'
      })
      const response = await POST(request)

      const data = await response.json()
      expect(data.data.notifications_created).toBe(0)
      expect(data.data.emails_queued).toBe(0)

      // Should still mark deadline as alerted
      expect(mockSupabase.update).toHaveBeenCalledTimes(1)
    })

    it('handles database errors gracefully', async () => {
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check', {
        method: 'POST'
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to fetch deadlines')
    })

    it('continues processing even if notification creation fails', async () => {
      mockSupabase.eq.mockResolvedValue({
        data: mockUpcomingDeadlines,
        error: null
      })

      mockSupabase.update.mockResolvedValue({ data: null, error: null })
      
      // Mock notification insert to fail
      mockSupabase.insert
        .mockResolvedValueOnce({ data: null, error: new Error('Notification error') })
        .mockResolvedValueOnce({ data: null, error: null }) // Activity log succeeds

      const request = new NextRequest('http://localhost:3000/api/deadlines/check', {
        method: 'POST'
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      // Should still mark deadlines as alerted
      expect(mockSupabase.update).toHaveBeenCalledTimes(2)
    })

    it('creates system activity log', async () => {
      mockSupabase.eq.mockResolvedValue({
        data: mockUpcomingDeadlines,
        error: null
      })

      mockSupabase.update.mockResolvedValue({ data: null, error: null })
      mockSupabase.insert.mockResolvedValue({ data: null, error: null })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check', {
        method: 'POST'
      })
      await POST(request)

      // Should create activity log (second insert call)
      expect(mockSupabase.insert).toHaveBeenCalledTimes(2)
      expect(mockSupabase.insert).toHaveBeenLastCalledWith({
        type: 'system_deadline_check',
        title: 'Deadline alerts processed',
        description: 'Processed 2 upcoming deadlines, created 2 notifications',
        user_id: null,
        entity_type: 'system',
        entity_id: null,
        metadata: {
          deadlines_processed: 2,
          notifications_created: 2,
          emails_queued: 2
        }
      })
    })

    it('handles internal server errors', async () => {
      mockSupabase.eq.mockRejectedValue(new Error('Internal error'))

      const request = new NextRequest('http://localhost:3000/api/deadlines/check', {
        method: 'POST'
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET /api/deadlines/check', () => {
    it('requires authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('requires admin role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { id: 'user-1', role: 'Assistant' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check')
      const response = await GET(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Insufficient permissions')
    })

    it('allows admin users to trigger deadline check', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: mockAdminProfile,
        error: null
      })

      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Deadline check completed')
    })

    it('allows SuperAdmin users to trigger deadline check', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: { ...mockAdminProfile, role: 'SuperAdmin' },
        error: null
      })

      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('handles profile fetch errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Profile not found')
      })

      const request = new NextRequest('http://localhost:3000/api/deadlines/check')
      const response = await GET(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Insufficient permissions')
    })
  })
})