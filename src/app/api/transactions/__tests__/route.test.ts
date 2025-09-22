import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn(),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}))

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}))

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
}

describe('/api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/transactions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should fetch transactions with default filters', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const mockQuery = {
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'transaction-1',
              address: '123 Main St',
              price: 250000,
              commission_rate: 3.0,
              status: 'Active',
              client: { id: 'client-1', name: 'John Doe' },
            },
          ],
          error: null,
          count: 1,
        }),
      }

      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => mockQuery),
        })),
      } as any)

      const request = new NextRequest('http://localhost/api/transactions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.page).toBe(1)
      expect(data.limit).toBe(10)
    })

    it('should apply search filters', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const mockQuery = {
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      }

      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => mockQuery),
        })),
      } as any)

      const url = 'http://localhost/api/transactions?search=Main&status=Active,Pending&page=2&limit=5'
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockQuery.or).toHaveBeenCalledWith('address.ilike.%Main%')
      expect(mockQuery.in).toHaveBeenCalledWith('status', ['Active', 'Pending'])
      expect(mockQuery.range).toHaveBeenCalledWith(5, 9) // page 2, limit 5
    })

    it('should handle database errors', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const mockQuery = {
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
          count: null,
        }),
      }

      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => mockQuery),
        })),
      } as any)

      const request = new NextRequest('http://localhost/api/transactions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch transactions')
    })
  })

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/transactions', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should create a new transaction', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'clients') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { id: '123e4567-e89b-12d3-a456-426614174001', assigned_agent: 'user-1' },
                    error: null,
                  }),
                })),
              })),
            }
          }
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { role: 'Admin' },
                    error: null,
                  }),
                })),
              })),
            }
          }
          if (table === 'transactions') {
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'transaction-1',
                      address: '123 Main St',
                      client_id: '123e4567-e89b-12d3-a456-426614174001',
                      price: 250000,
                      commission_rate: 3.0,
                      net_commission: 6000,
                      broker_commission: 1500,
                      status: 'Active',
                    },
                    error: null,
                  }),
                })),
              })),
            }
          }
          return mockSupabase.from(table)
        }),
      }

      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const transactionData = {
        address: '123 Main St',
        client_id: '123e4567-e89b-12d3-a456-426614174001',
        price: 250000,
        commission_rate: 3.0,
        status: 'Active',
      }

      const request = new NextRequest('http://localhost/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.address).toBe('123 Main St')
      expect(data.data.price).toBe(250000)
    })

    it('should return 404 if client not found', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            })),
          })),
        })),
      }

      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const transactionData = {
        address: '123 Main St',
        client_id: '123e4567-e89b-12d3-a456-426614174002',
        price: 250000,
        commission_rate: 3.0,
      }

      const request = new NextRequest('http://localhost/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Client not found')
    })

    it('should return 403 if user lacks permissions', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'clients') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { id: '123e4567-e89b-12d3-a456-426614174003', assigned_agent: 'other-user' },
                    error: null,
                  }),
                })),
              })),
            }
          }
          if (table === 'profiles') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { role: 'Assistant' },
                    error: null,
                  }),
                })),
              })),
            }
          }
          return mockSupabase.from(table)
        }),
      }

      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const transactionData = {
        address: '123 Main St',
        client_id: '123e4567-e89b-12d3-a456-426614174003',
        price: 250000,
        commission_rate: 3.0,
      }

      const request = new NextRequest('http://localhost/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('should validate request data', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const invalidData = {
        address: '', // Invalid: empty address
        client_id: 'invalid-uuid', // Invalid: not a UUID
        price: -1000, // Invalid: negative price
        commission_rate: 150, // Invalid: > 100%
      }

      const request = new NextRequest('http://localhost/api/transactions', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})