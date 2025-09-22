import { renderHook, waitFor } from '@testing-library/react'
import { useRevenueAnalytics } from '../useRevenueAnalytics'

import { vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('useRevenueAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch revenue analytics data successfully', async () => {
    const mockData = {
      data: {
        totalRevenue: 50000,
        commissionRevenue: 60000,
        closedDeals: 5,
        averageDealSize: 10000,
        yearOverYearGrowth: 15.5,
        goalProgress: 25.0,
        monthlyRevenue: [10000, 15000, 0, 0, 25000, 0, 0, 0, 0, 0, 0, 0],
        monthlyLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        monthlyDeals: [1, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
        quarterlyRevenue: [25000, 25000, 0, 0],
        quarterlyLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
        trendDirection: 'up' as const,
        metrics: {
          activeMonths: 3,
          peakMonth: 'May',
          peakRevenue: 25000,
          averageMonthly: 4166.67,
          conversionRate: 0.15,
          averageCommissionRate: 2.75
        }
      },
      transactions: [
        {
          id: 'trans-1',
          address: '123 Main St',
          price: 500000,
          commission_rate: 3,
          gross_commission: 15000,
          net_commission: 12000,
          broker_commission: 3000,
          status: 'Closed',
          closing_date: '2024-01-15',
          created_at: '2024-01-01T00:00:00Z'
        }
      ],
      dateRange: { from: '2024-01-01', to: '2024-12-31' }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response)

    const { result } = renderHook(() => useRevenueAnalytics({
      from: '2024-01-01',
      to: '2024-12-31'
    }))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBe(null)
    expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/revenue?from=2024-01-01&to=2024-12-31')
  })

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch revenue analytics'
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    } as Response)

    const { result } = renderHook(() => useRevenueAnalytics())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBe(null)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe(errorMessage)
  })

  it('should handle network errors', async () => {
    const networkError = new Error('Network error')
    mockFetch.mockRejectedValueOnce(networkError)

    const { result } = renderHook(() => useRevenueAnalytics())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBe(null)
    expect(result.current.error).toEqual(networkError)
  })

  it('should use default date range when not provided', async () => {
    const currentYear = new Date().getFullYear()
    const today = new Date().toISOString().split('T')[0]
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {}, transactions: [], dateRange: {} }),
    } as Response)

    renderHook(() => useRevenueAnalytics())

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/dashboard/revenue?from=${currentYear}-01-01&to=${today}`
      )
    })
  })

  it('should not fetch when disabled', async () => {
    renderHook(() => useRevenueAnalytics({ enabled: false }))

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  it('should refetch data when refetch is called', async () => {
    const mockData = {
      data: { totalRevenue: 50000 },
      transactions: [],
      dateRange: { from: '2024-01-01', to: '2024-12-31' }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response)

    const { result } = renderHook(() => useRevenueAnalytics())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Call refetch
    await result.current.refetch()

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should refetch when date range changes', async () => {
    const mockData = {
      data: { totalRevenue: 50000 },
      transactions: [],
      dateRange: { from: '2024-01-01', to: '2024-12-31' }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response)

    const { result, rerender } = renderHook(
      ({ from, to }) => useRevenueAnalytics({ from, to }),
      {
        initialProps: { from: '2024-01-01', to: '2024-06-30' }
      }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenLastCalledWith('/api/dashboard/revenue?from=2024-01-01&to=2024-06-30')

    // Change date range
    rerender({ from: '2024-01-01', to: '2024-12-31' })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    expect(mockFetch).toHaveBeenLastCalledWith('/api/dashboard/revenue?from=2024-01-01&to=2024-12-31')
  })

  it('should handle malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    } as Response)

    const { result } = renderHook(() => useRevenueAnalytics())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBe(null)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Invalid JSON')
  })
})