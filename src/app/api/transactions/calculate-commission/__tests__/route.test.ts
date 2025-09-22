import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock dependencies
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}))

describe('/api/transactions/calculate-commission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/transactions/calculate-commission', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should calculate commission with default broker split', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const calculationData = {
        price: 250000,
        commission_rate: 3.0,
      }

      const request = new NextRequest('http://localhost/api/transactions/calculate-commission', {
        method: 'POST',
        body: JSON.stringify(calculationData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.price).toBe(250000)
      expect(data.data.commission_rate).toBe(3.0)
      expect(data.data.broker_split).toBe(20) // Default value
      expect(data.data.gross_commission).toBe(7500) // 250000 * 3% = 7500
      expect(data.data.broker_commission).toBe(1500) // 7500 * 20% = 1500
      expect(data.data.net_commission).toBe(6000) // 7500 - 1500 = 6000
    })

    it('should calculate commission with custom broker split', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const calculationData = {
        price: 300000,
        commission_rate: 2.5,
        broker_split: 25,
      }

      const request = new NextRequest('http://localhost/api/transactions/calculate-commission', {
        method: 'POST',
        body: JSON.stringify(calculationData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.price).toBe(300000)
      expect(data.data.commission_rate).toBe(2.5)
      expect(data.data.broker_split).toBe(25)
      expect(data.data.gross_commission).toBe(7500) // 300000 * 2.5% = 7500
      expect(data.data.broker_commission).toBe(1875) // 7500 * 25% = 1875
      expect(data.data.net_commission).toBe(5625) // 7500 - 1875 = 5625
    })

    it('should include formatted values in breakdown', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const calculationData = {
        price: 250000,
        commission_rate: 3.0,
        broker_split: 20,
      }

      const request = new NextRequest('http://localhost/api/transactions/calculate-commission', {
        method: 'POST',
        body: JSON.stringify(calculationData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.breakdown).toBeDefined()
      expect(data.data.breakdown.price_formatted).toBe('$250,000.00')
      expect(data.data.breakdown.gross_commission_formatted).toBe('$7,500.00')
      expect(data.data.breakdown.broker_commission_formatted).toBe('$1,500.00')
      expect(data.data.breakdown.net_commission_formatted).toBe('$6,000.00')
      expect(data.data.breakdown.commission_rate_formatted).toBe('3%')
      expect(data.data.breakdown.broker_split_formatted).toBe('20%')
    })

    it('should validate input parameters', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const invalidData = {
        price: -1000, // Invalid: negative price
        commission_rate: 150, // Invalid: > 100%
        broker_split: 150, // Invalid: > 100%
      }

      const request = new NextRequest('http://localhost/api/transactions/calculate-commission', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should handle missing required fields', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const incompleteData = {
        price: 250000,
        // Missing commission_rate
      }

      const request = new NextRequest('http://localhost/api/transactions/calculate-commission', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should calculate zero commission for zero rate', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const calculationData = {
        price: 250000,
        commission_rate: 0,
        broker_split: 20,
      }

      const request = new NextRequest('http://localhost/api/transactions/calculate-commission', {
        method: 'POST',
        body: JSON.stringify(calculationData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.gross_commission).toBe(0)
      expect(data.data.broker_commission).toBe(0)
      expect(data.data.net_commission).toBe(0)
    })

    it('should handle zero broker split', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const calculationData = {
        price: 250000,
        commission_rate: 3.0,
        broker_split: 0,
      }

      const request = new NextRequest('http://localhost/api/transactions/calculate-commission', {
        method: 'POST',
        body: JSON.stringify(calculationData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.gross_commission).toBe(7500)
      expect(data.data.broker_commission).toBe(0)
      expect(data.data.net_commission).toBe(7500) // All commission goes to agent
    })

    it('should handle 100% broker split', async () => {
      const { getSession } = await import('@/lib/session')
      vi.mocked(getSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any)

      const calculationData = {
        price: 250000,
        commission_rate: 3.0,
        broker_split: 100,
      }

      const request = new NextRequest('http://localhost/api/transactions/calculate-commission', {
        method: 'POST',
        body: JSON.stringify(calculationData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.gross_commission).toBe(7500)
      expect(data.data.broker_commission).toBe(7500)
      expect(data.data.net_commission).toBe(0) // All commission goes to broker
    })
  })
})