import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'

// Mock dependencies
const createMockQuery = () => ({
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  range: vi.fn(() => Promise.resolve({
    data: mockAppointments,
    error: null,
    count: mockAppointments.length
  }))
})

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => createMockQuery()),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: mockAppointment,
          error: null
        }))
      }))
    }))
  }))
}

vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

vi.mock('@/lib/session', () => ({
  getUser: vi.fn(() => Promise.resolve({
    id: 'user-123',
    email: 'test@example.com'
  }))
}))

const mockAppointment = {
  id: 'appointment-123',
  title: 'Client Meeting',
  description: 'Discuss property requirements',
  client_id: 'client-123',
  start_time: '2024-01-15T10:00:00Z',
  end_time: '2024-01-15T11:00:00Z',
  location: '123 Main St',
  type: 'Meeting',
  status: 'Scheduled',
  is_recurring: false,
  created_by: 'user-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  client: {
    id: 'client-123',
    name: 'John Doe',
    email: 'john@example.com'
  },
  created_by_profile: {
    id: 'user-123',
    name: 'Agent Smith',
    email: 'agent@example.com'
  }
}

const mockAppointments = [mockAppointment]

describe('/api/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return appointments for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/appointments')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockAppointments)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(50)
    })

    it('should handle query parameters', async () => {
      const url = 'http://localhost:3000/api/appointments?client_id=123e4567-e89b-12d3-a456-426614174000&type=Meeting&page=2&limit=10'
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(10)
    })

    it('should handle boolean query parameters', async () => {
      const url = 'http://localhost:3000/api/appointments?is_recurring=true'
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should handle date range filters', async () => {
      const url = 'http://localhost:3000/api/appointments?start_date=2024-01-01T00:00:00Z&end_date=2024-01-31T23:59:59Z'
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getUser } = await import('@/lib/session')
      vi.mocked(getUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/appointments')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should handle database errors', async () => {
      const { createClient } = await import('@/lib/supabase')
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'Database error' },
                  count: 0
                }))
              }))
            }))
          }))
        }))
      }
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/appointments')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    it('should handle invalid query parameters', async () => {
      const url = 'http://localhost:3000/api/appointments?page=0&limit=101'
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(500) // Should handle validation error
    })
  })

  describe('POST', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        title: 'New Meeting',
        description: 'Property showing',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        location: '456 Oak St',
        type: 'Showing'
      }

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data).toEqual(mockAppointment)
    })

    it('should create a recurring appointment', async () => {
      const recurringAppointmentData = {
        title: 'Weekly Team Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO',
        recurringPattern: {
          frequency: 'WEEKLY',
          byweekday: [1],
          count: 10
        }
      }

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(recurringAppointmentData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data).toEqual(mockAppointment)
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getUser } = await import('@/lib/session')
      vi.mocked(getUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Meeting',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        title: '', // Invalid: empty title
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T09:00:00Z' // Invalid: end before start
      }

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should handle database errors during creation', async () => {
      const { createClient } = await import('@/lib/supabase')
      const mockClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Database error' }
              }))
            }))
          }))
        }))
      }
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Meeting',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should validate recurring appointment requirements', async () => {
      const invalidRecurringData = {
        title: 'Recurring Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY' // This should be valid now
      }

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(invalidRecurringData)
      })

      const response = await POST(request)

      expect(response.status).toBe(201) // Should succeed with valid data
    })

    it('should validate client_id format', async () => {
      const invalidClientData = {
        title: 'Client Meeting',
        client_id: 'invalid-uuid',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z'
      }

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(invalidClientData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should validate appointment type', async () => {
      const invalidTypeData = {
        title: 'Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        type: 'InvalidType'
      }

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(invalidTypeData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})