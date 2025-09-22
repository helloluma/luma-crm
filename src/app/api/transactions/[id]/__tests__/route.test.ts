import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}))

describe('/api/transactions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/transactions/123')
      const response = await GET(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should fetch a transaction by id', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const mockTransaction = {
        id: 'transaction-1',
        address: '123 Main St',
        price: 250000,
        commission_rate: 3.0,
        status: 'Active',
        client: {
          id: 'client-1',
          name: 'John Doe',
          assigned_agent: 'user-1',
        },
      }

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'transactions') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: mockTransaction,
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
        }),
      }

      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const request = new NextRequest('http://localhost/api/transactions/transaction-1')
      const response = await GET(request, { params: { id: 'transaction-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.id).toBe('transaction-1')
      expect(data.data.address).toBe('123 Main St')
    })

    it('should return 404 if transaction not found', async () => {
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

      const request = new NextRequest('http://localhost/api/transactions/nonexistent')
      const response = await GET(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Transaction not found')
    })

    it('should return 403 if user lacks permissions', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const mockTransaction = {
        id: 'transaction-1',
        address: '123 Main St',
        client: {
          assigned_agent: 'other-user',
        },
      }

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'transactions') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: mockTransaction,
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
        }),
      }

      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const request = new NextRequest('http://localhost/api/transactions/transaction-1')
      const response = await GET(request, { params: { id: 'transaction-1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })
  })

  describe('PUT', () => {
    it('should update a transaction', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const currentTransaction = {
        id: 'transaction-1',
        price: 250000,
        commission_rate: 3.0,
        client: { assigned_agent: 'user-1' },
      }

      const updatedTransaction = {
        ...currentTransaction,
        price: 275000,
        status: 'Pending',
      }

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'transactions') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: currentTransaction,
                    error: null,
                  }),
                })),
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                      data: updatedTransaction,
                      error: null,
                    }),
                  })),
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
        }),
      }

      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const updateData = {
        price: 275000,
        status: 'Pending',
      }

      const request = new NextRequest('http://localhost/api/transactions/transaction-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })
      const response = await PUT(request, { params: { id: 'transaction-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.price).toBe(275000)
      expect(data.data.status).toBe('Pending')
    })

    it('should recalculate commissions when price changes', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const currentTransaction = {
        id: 'transaction-1',
        price: 250000,
        commission_rate: 3.0,
        net_commission: 6000,
        broker_commission: 1500,
        client: { assigned_agent: 'user-1' },
      }

      let updateCallData: any = null
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'transactions') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: currentTransaction,
                    error: null,
                  }),
                })),
              })),
              update: vi.fn((data: any) => {
                updateCallData = data
                return {
                  eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                      single: vi.fn().mockResolvedValue({
                        data: { ...currentTransaction, ...data },
                        error: null,
                      }),
                    })),
                  })),
                }
              }),
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
        }),
      }

      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const updateData = { price: 300000 }

      const request = new NextRequest('http://localhost/api/transactions/transaction-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })
      await PUT(request, { params: { id: 'transaction-1' } })

      // Verify that commissions were recalculated
      expect(updateCallData.price).toBe(300000)
      expect(updateCallData.net_commission).toBeGreaterThan(6000) // Should be higher due to higher price
      expect(updateCallData.broker_commission).toBeGreaterThan(1500)
    })

    it('should return 404 if transaction not found', async () => {
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

      const request = new NextRequest('http://localhost/api/transactions/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({ price: 300000 }),
      })
      const response = await PUT(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Transaction not found')
    })
  })

  describe('DELETE', () => {
    it('should delete a transaction with admin permissions', async () => {
      const { getSession } = await import('@/lib/session')
      const { createClient } = await import('@/lib/supabase')

      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const mockClient = {
        from: vi.fn((table: string) => {
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
              delete: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              })),
            }
          }
        }),
      }

      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const request = new NextRequest('http://localhost/api/transactions/transaction-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: 'transaction-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Transaction deleted successfully')
    })

    it('should return 403 if user lacks delete permissions', async () => {
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
                data: { role: 'Assistant' },
                error: null,
              }),
            })),
          })),
        })),
      }

      vi.mocked(createClient).mockReturnValue(mockClient as any)

      const request = new NextRequest('http://localhost/api/transactions/transaction-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: 'transaction-1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })
  })
})