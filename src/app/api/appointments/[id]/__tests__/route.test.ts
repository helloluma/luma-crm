import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT, DELETE } from '../route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

vi.mock('@/lib/session', () => ({
  getUser: vi.fn(() => Promise.resolve({
    id: '123e4567-e89b-12d3-a456-426614174002',
    email: 'test@example.com'
  }))
}))

const mockAppointment = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Client Meeting',
  description: 'Discuss property requirements',
  client_id: '123e4567-e89b-12d3-a456-426614174001',
  start_time: '2024-01-15T10:00:00Z',
  end_time: '2024-01-15T11:00:00Z',
  location: '123 Main St',
  type: 'Meeting',
  status: 'Scheduled',
  is_recurring: false,
  created_by: '123e4567-e89b-12d3-a456-426614174002',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  client: {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  },
  created_by_profile: {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Agent Smith',
    email: 'agent@example.com'
  },
  parent_appointment: null,
  recurring_instances: []
}

const createMockSelectQuery = () => ({
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(() => Promise.resolve({
    data: mockAppointment,
    error: null
  }))
})

const createMockUpdateQuery = () => ({
  eq: vi.fn(() => Promise.resolve({
    data: null,
    error: null
  })),
  or: vi.fn(() => Promise.resolve({
    data: null,
    error: null
  }))
})

const createMockDeleteQuery = () => ({
  eq: vi.fn(() => Promise.resolve({
    data: null,
    error: null
  })),
  or: vi.fn(() => Promise.resolve({
    data: null,
    error: null
  }))
})

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => createMockSelectQuery()),
    update: vi.fn(() => createMockUpdateQuery()),
    delete: vi.fn(() => createMockDeleteQuery())
  }))
}

describe('/api/appointments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return appointment for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/appointments/123e4567-e89b-12d3-a456-426614174000')
      const response = await GET(request, { params: { id: '123e4567-e89b-12d3-a456-426614174000' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockAppointment)
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getUser } = await import('@/lib/session')
      vi.mocked(getUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/appointments/appointment-123')
      const response = await GET(request, { params: { id: 'appointment-123' } })

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent appointment', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }
              }))
            }))
          }))
        }))
      }
      const { createClient } = await import('@/lib/supabase')
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/appointments/nonexistent')
      const response = await GET(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
    })

    it('should handle database errors', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Database error' }
              }))
            }))
          }))
        }))
      }
      const { createClient } = await import('@/lib/supabase')
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/appointments/appointment-123')
      const response = await GET(request, { params: { id: 'appointment-123' } })

      expect(response.status).toBe(500)
    })
  })

  describe('PUT', () => {
    it('should update appointment', async () => {
      const updateData = {
        title: 'Updated Meeting',
        description: 'Updated description'
      }

      const request = new NextRequest('http://localhost:3000/api/appointments/123e4567-e89b-12d3-a456-426614174000', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: { id: '123e4567-e89b-12d3-a456-426614174000' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockAppointment)
    })

    it('should update recurring series when requested', async () => {
      const updateData = {
        title: 'Updated Recurring Meeting',
        updateRecurringSeries: true
      }

      const recurringAppointment = {
        ...mockAppointment,
        is_recurring: true,
        parent_appointment_id: null
      }

      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: recurringAppointment,
                error: null
              }))
            }))
          })),
          update: vi.fn(() => ({
            or: vi.fn(() => Promise.resolve({
              data: null,
              error: null
            }))
          }))
        }))
      }
      const { createClient } = await import('@/lib/supabase')
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/appointments/appointment-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: { id: 'appointment-123' } })

      expect(response.status).toBe(200)
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getUser } = await import('@/lib/session')
      vi.mocked(getUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/appointments/appointment-123', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' })
      })

      const response = await PUT(request, { params: { id: 'appointment-123' } })

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent appointment', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }
              }))
            }))
          }))
        }))
      }
      const { createClient } = await import('@/lib/supabase')
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/appointments/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' })
      })

      const response = await PUT(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T09:00:00Z' // Invalid: end before start
      }

      const request = new NextRequest('http://localhost:3000/api/appointments/appointment-123', {
        method: 'PUT',
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request, { params: { id: 'appointment-123' } })

      expect(response.status).toBe(400)
    })

    it('should handle database errors during update', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockAppointment,
                error: null
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      }
      const { createClient } = await import('@/lib/supabase')
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/appointments/appointment-123', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' })
      })

      const response = await PUT(request, { params: { id: 'appointment-123' } })

      expect(response.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('should delete appointment', async () => {
      const request = new NextRequest('http://localhost:3000/api/appointments/appointment-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'appointment-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Appointment deleted successfully')
    })

    it('should delete recurring series when requested', async () => {
      const recurringAppointment = {
        ...mockAppointment,
        is_recurring: true,
        parent_appointment_id: null
      }

      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: recurringAppointment,
                error: null
              }))
            }))
          })),
          delete: vi.fn(() => ({
            or: vi.fn(() => Promise.resolve({
              data: null,
              error: null
            }))
          }))
        }))
      }
      const { createClient } = await import('@/lib/supabase')
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)

      const url = 'http://localhost:3000/api/appointments/appointment-123?deleteRecurringSeries=true'
      const request = new NextRequest(url, { method: 'DELETE' })

      const response = await DELETE(request, { params: { id: 'appointment-123' } })

      expect(response.status).toBe(200)
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getUser } = await import('@/lib/session')
      vi.mocked(getUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/appointments/appointment-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'appointment-123' } })

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent appointment', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { code: 'PGRST116' }
              }))
            }))
          }))
        }))
      }
      const { createClient } = await import('@/lib/supabase')
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/appointments/nonexistent', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
    })

    it('should handle database errors during deletion', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockAppointment,
                error: null
              }))
            }))
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      }
      const { createClient } = await import('@/lib/supabase')
      vi.mocked(createClient).mockReturnValueOnce(mockClient as any)

      const request = new NextRequest('http://localhost:3000/api/appointments/appointment-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'appointment-123' } })

      expect(response.status).toBe(500)
    })
  })
})