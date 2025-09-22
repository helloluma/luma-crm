import { renderHook, waitFor } from '@testing-library/react'
import { useDashboardMetrics } from '../useDashboardMetrics'

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockUseSWR = require('swr').default as jest.MockedFunction<typeof import('swr').default>

const mockMetricsData = {
  totalClients: 150,
  activeDeals: 25,
  monthlyRevenue: 45000,
  conversionRate: 18,
  previousMonth: {
    totalClients: 134,
    activeDeals: 26,
    monthlyRevenue: 41667,
    conversionRate: 15,
  },
}

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns loading state initially', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: jest.fn(),
    })

    const { result } = renderHook(() => useDashboardMetrics())

    expect(result.current.loading).toBe(true)
    expect(result.current.metrics).toEqual([])
    expect(result.current.error).toBeUndefined()
  })

  it('processes metrics data correctly', async () => {
    mockUseSWR.mockReturnValue({
      data: mockMetricsData,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    })

    const { result } = renderHook(() => useDashboardMetrics())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.metrics).toHaveLength(4)
    })

    const metrics = result.current.metrics

    // Check total clients metric
    const clientsMetric = metrics.find(m => m.id === 'total-clients')
    expect(clientsMetric).toEqual({
      id: 'total-clients',
      title: 'Total Clients',
      value: 150,
      change: 12, // (150 - 134) / 134 * 100 = ~12%
      changeType: 'increase',
      icon: 'users',
    })

    // Check active deals metric
    const dealsMetric = metrics.find(m => m.id === 'active-deals')
    expect(dealsMetric).toEqual({
      id: 'active-deals',
      title: 'Active Deals',
      value: 25,
      change: -4, // (25 - 26) / 26 * 100 = ~-4%
      changeType: 'decrease',
      icon: 'target',
    })

    // Check monthly revenue metric
    const revenueMetric = metrics.find(m => m.id === 'monthly-revenue')
    expect(revenueMetric).toEqual({
      id: 'monthly-revenue',
      title: 'Monthly Revenue',
      value: '$45,000',
      change: 8, // (45000 - 41667) / 41667 * 100 = ~8%
      changeType: 'increase',
      icon: 'dollar',
    })

    // Check conversion rate metric
    const conversionMetric = metrics.find(m => m.id === 'conversion-rate')
    expect(conversionMetric).toEqual({
      id: 'conversion-rate',
      title: 'Conversion Rate',
      value: '18%',
      change: 20, // (18 - 15) / 15 * 100 = 20%
      changeType: 'increase',
      icon: 'calendar',
    })
  })

  it('handles error state', () => {
    const mockError = new Error('Failed to fetch')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: jest.fn(),
    })

    const { result } = renderHook(() => useDashboardMetrics())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(mockError)
    expect(result.current.metrics).toEqual([])
  })

  it('calculates change percentages correctly', async () => {
    const testData = {
      ...mockMetricsData,
      totalClients: 100,
      previousMonth: {
        ...mockMetricsData.previousMonth,
        totalClients: 0, // Test division by zero
      },
    }

    mockUseSWR.mockReturnValue({
      data: testData,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    })

    const { result } = renderHook(() => useDashboardMetrics())

    await waitFor(() => {
      expect(result.current.metrics).toHaveLength(4)
    })

    const clientsMetric = result.current.metrics.find(m => m.id === 'total-clients')
    expect(clientsMetric?.change).toBe(100) // Should handle division by zero
    expect(clientsMetric?.changeType).toBe('increase')
  })

  it('determines change types correctly', async () => {
    const testData = {
      totalClients: 100,
      activeDeals: 50,
      monthlyRevenue: 30000,
      conversionRate: 15,
      previousMonth: {
        totalClients: 120, // Decrease
        activeDeals: 50,   // No change
        monthlyRevenue: 25000, // Increase
        conversionRate: 20, // Decrease
      },
    }

    mockUseSWR.mockReturnValue({
      data: testData,
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
    })

    const { result } = renderHook(() => useDashboardMetrics())

    await waitFor(() => {
      expect(result.current.metrics).toHaveLength(4)
    })

    const metrics = result.current.metrics

    expect(metrics.find(m => m.id === 'total-clients')?.changeType).toBe('decrease')
    expect(metrics.find(m => m.id === 'active-deals')?.changeType).toBe('neutral')
    expect(metrics.find(m => m.id === 'monthly-revenue')?.changeType).toBe('increase')
    expect(metrics.find(m => m.id === 'conversion-rate')?.changeType).toBe('decrease')
  })

  it('provides refresh function', () => {
    const mockMutate = jest.fn()
    mockUseSWR.mockReturnValue({
      data: mockMetricsData,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    })

    const { result } = renderHook(() => useDashboardMetrics())

    expect(typeof result.current.refresh).toBe('function')
    
    result.current.refresh()
    expect(mockMutate).toHaveBeenCalled()
  })
})