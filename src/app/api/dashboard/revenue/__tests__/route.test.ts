import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createClient } from '@/lib/supabase'
import { getSession } from '@/lib/session'

import { vi } from 'vitest'

// Mock dependencies
vi.mock('@/lib/supabase')
vi.mock('@/lib/session')

const mockCreateClient = vi.mocked(createClient)
const mockGetSession = vi.mocked(getSession)

describe('/api/dashboard/revenue', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/dashboard/revenue')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return revenue analytics for authenticated user', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockGetSession.mockResolvedValue({ user: mockUser } as any)

      const mockTransactions = [
        {
          id: 'trans-1',
          address: '123 Main St',
          price: 500000,
          commission_rate: 3,
          gross_commission: 15000,
          net_commission: 12000,
          broker_commission: 3000,
          status: 'Closed',
          closing_date: '2024-06-15',
          created_at: '2024-06-01T00:00:00Z',
          client: { id: 'client-1', name: 'John Doe', type: 'Client' }
        },
        {
          id: 'trans-2',
          address: '456 Oak Ave',
          price: 750000,
          commission_rate: 2.5,
          gross_commission: 18750,
          net_commission: 15000,
          broker_commission: 3750,
          status: 'Closed',
          closing_date: '2024-07-20',
          created_at: '2024-07-01T00:00:00Z',
          client: { id: 'client-2', name: 'Jane Smith', type: 'Client' }
        }
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockTransactions,
        error: null
      })

      const request = new NextRequest('http://localhost/api/dashboard/revenue?from=2024-01-01&to=2024-12-31')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(data.transactions).toEqual(mockTransactions)
      expect(data.dateRange).toEqual({ from: '2024-01-01', to: '2024-12-31' })

      // Verify analytics calculations
      expect(data.data.totalRevenue).toBe(27000) // 12000 + 15000
      expect(data.data.commissionRevenue).toBe(33750) // 15000 + 18750
      expect(data.data.closedDeals).toBe(2)
      expect(data.data.averageDealSize).toBe(13500) // 27000 / 2
      expect(data.data.monthlyRevenue).toHaveLength(12)
      expect(data.data.monthlyLabels).toHaveLength(12)
    })

    it('should use default date range if not provided', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockGetSession.mockResolvedValue({ user: mockUser } as any)

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost/api/dashboard/revenue')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.dateRange.from).toMatch(/^\d{4}-01-01$/) // Current year start
      expect(data.dateRange.to).toMatch(/^\d{4}-\d{2}-\d{2}$/) // Today's date
    })

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockGetSession.mockResolvedValue({ user: mockUser } as any)

      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const request = new NextRequest('http://localhost/api/dashboard/revenue')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch revenue data')
    })

    it('should calculate monthly revenue correctly', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockGetSession.mockResolvedValue({ user: mockUser } as any)

      const currentYear = new Date().getFullYear()
      const mockTransactions = [
        {
          id: 'trans-1',
          address: '123 Main St',
          price: 500000,
          commission_rate: 3,
          gross_commission: 15000,
          net_commission: 10000,
          broker_commission: 5000,
          status: 'Closed',
          closing_date: `${currentYear}-01-15`, // January
          created_at: `${currentYear}-01-01T00:00:00Z`,
          client: { id: 'client-1', name: 'John Doe', type: 'Client' }
        },
        {
          id: 'trans-2',
          address: '456 Oak Ave',
          price: 750000,
          commission_rate: 2.5,
          gross_commission: 18750,
          net_commission: 15000,
          broker_commission: 3750,
          status: 'Closed',
          closing_date: `${currentYear}-01-20`, // January
          created_at: `${currentYear}-01-01T00:00:00Z`,
          client: { id: 'client-2', name: 'Jane Smith', type: 'Client' }
        },
        {
          id: 'trans-3',
          address: '789 Pine St',
          price: 600000,
          commission_rate: 3,
          gross_commission: 18000,
          net_commission: 14000,
          broker_commission: 4000,
          status: 'Closed',
          closing_date: `${currentYear}-03-10`, // March
          created_at: `${currentYear}-03-01T00:00:00Z`,
          client: { id: 'client-3', name: 'Bob Johnson', type: 'Client' }
        }
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockTransactions,
        error: null
      })

      const request = new NextRequest(`http://localhost/api/dashboard/revenue?from=${currentYear}-01-01&to=${currentYear}-12-31`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Check monthly revenue distribution
      expect(data.data.monthlyRevenue[0]).toBe(25000) // January: 10000 + 15000
      expect(data.data.monthlyRevenue[1]).toBe(0) // February: 0
      expect(data.data.monthlyRevenue[2]).toBe(14000) // March: 14000
      
      // Check totals
      expect(data.data.totalRevenue).toBe(39000) // 10000 + 15000 + 14000
      expect(data.data.closedDeals).toBe(3)
    })

    it('should calculate quarterly data correctly', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockGetSession.mockResolvedValue({ user: mockUser } as any)

      const currentYear = new Date().getFullYear()
      const mockTransactions = [
        {
          id: 'trans-1',
          address: '123 Main St',
          price: 500000,
          commission_rate: 3,
          gross_commission: 15000,
          net_commission: 10000,
          broker_commission: 5000,
          status: 'Closed',
          closing_date: `${currentYear}-02-15`, // Q1
          created_at: `${currentYear}-02-01T00:00:00Z`,
          client: { id: 'client-1', name: 'John Doe', type: 'Client' }
        },
        {
          id: 'trans-2',
          address: '456 Oak Ave',
          price: 750000,
          commission_rate: 2.5,
          gross_commission: 18750,
          net_commission: 15000,
          broker_commission: 3750,
          status: 'Closed',
          closing_date: `${currentYear}-05-20`, // Q2
          created_at: `${currentYear}-05-01T00:00:00Z`,
          client: { id: 'client-2', name: 'Jane Smith', type: 'Client' }
        }
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockTransactions,
        error: null
      })

      const request = new NextRequest(`http://localhost/api/dashboard/revenue?from=${currentYear}-01-01&to=${currentYear}-12-31`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.quarterlyRevenue).toHaveLength(4)
      expect(data.data.quarterlyRevenue[0]).toBe(10000) // Q1
      expect(data.data.quarterlyRevenue[1]).toBe(15000) // Q2
      expect(data.data.quarterlyRevenue[2]).toBe(0) // Q3
      expect(data.data.quarterlyRevenue[3]).toBe(0) // Q4
    })
  })
})