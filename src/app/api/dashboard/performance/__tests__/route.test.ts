import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

describe('/api/dashboard/performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const request = new NextRequest('http://localhost:3000/api/dashboard/performance')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('handles database errors gracefully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock database error
    mockSupabaseClient.from.mockImplementation(() => {
      throw new Error('Database connection failed')
    })

    const request = new NextRequest('http://localhost:3000/api/dashboard/performance')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch performance data')
  })

  it('parses months parameter correctly', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock simplified database response that returns empty data
    const mockQueryChain = {
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ count: 0, data: [] })
        }),
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [] })
          })
        }),
        or: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ count: 0 })
          })
        })
      })
    }
    
    mockSupabaseClient.from.mockReturnValue(mockQueryChain)

    // Test with valid months parameter
    const request = new NextRequest('http://localhost:3000/api/dashboard/performance?months=3')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    
    // Should return data structure with correct properties
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('totalRevenue')
    expect(data).toHaveProperty('totalClients')
    expect(data).toHaveProperty('totalDeals')
    expect(data).toHaveProperty('averageConversionRate')
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBe(3) // Should respect the months parameter
  })

  it('returns correct data structure for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock simplified database response
    const mockQueryChain = {
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ count: 0, data: [] })
        }),
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [] })
          })
        }),
        or: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ count: 0 })
          })
        })
      })
    }
    
    mockSupabaseClient.from.mockReturnValue(mockQueryChain)

    const request = new NextRequest('http://localhost:3000/api/dashboard/performance')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    
    // Verify response structure
    expect(data).toHaveProperty('data')
    expect(data).toHaveProperty('totalRevenue', 0)
    expect(data).toHaveProperty('totalClients', 0)
    expect(data).toHaveProperty('totalDeals', 0)
    expect(data).toHaveProperty('averageConversionRate', 0)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBe(6) // Default 6 months
    
    // Verify each month has correct structure
    data.data.forEach((monthData: any) => {
      expect(monthData).toHaveProperty('month')
      expect(monthData).toHaveProperty('revenue')
      expect(monthData).toHaveProperty('clients')
      expect(monthData).toHaveProperty('deals')
      expect(monthData).toHaveProperty('conversionRate')
    })
  })
})