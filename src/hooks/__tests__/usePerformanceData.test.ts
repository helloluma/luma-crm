import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { usePerformanceData } from '../usePerformanceData'

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn(),
}))

import useSWR from 'swr'

const mockUseSWR = vi.mocked(useSWR)

describe('usePerformanceData', () => {
  const mockPerformanceData = {
    data: [
      {
        month: 'Jan 2024',
        revenue: 15000,
        clients: 5,
        deals: 3,
        conversionRate: 60,
      },
      {
        month: 'Feb 2024',
        revenue: 22000,
        clients: 8,
        deals: 5,
        conversionRate: 75,
      },
    ],
    totalRevenue: 37000,
    totalClients: 13,
    totalDeals: 8,
    averageConversionRate: 67.5,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns performance data when SWR succeeds', () => {
    mockUseSWR.mockReturnValue({
      data: mockPerformanceData,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    })

    const { result } = renderHook(() => usePerformanceData())

    expect(result.current.performanceData).toEqual(mockPerformanceData.data)
    expect(result.current.summary).toEqual({
      totalRevenue: 37000,
      totalClients: 13,
      totalDeals: 8,
      averageConversionRate: 67.5,
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('returns loading state when SWR is loading', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
      isValidating: false,
    })

    const { result } = renderHook(() => usePerformanceData())

    expect(result.current.performanceData).toEqual([])
    expect(result.current.summary).toEqual({
      totalRevenue: 0,
      totalClients: 0,
      totalDeals: 0,
      averageConversionRate: 0,
    })
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeUndefined()
  })

  it('returns error state when SWR fails', () => {
    const mockError = new Error('Failed to fetch performance data')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    })

    const { result } = renderHook(() => usePerformanceData())

    expect(result.current.performanceData).toEqual([])
    expect(result.current.summary).toEqual({
      totalRevenue: 0,
      totalClients: 0,
      totalDeals: 0,
      averageConversionRate: 0,
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(mockError)
  })

  it('calls SWR with correct parameters for default months', () => {
    mockUseSWR.mockReturnValue({
      data: mockPerformanceData,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    })

    renderHook(() => usePerformanceData())

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/dashboard/performance?months=6',
      expect.any(Function),
      {
        refreshInterval: 60000,
        revalidateOnFocus: true,
        dedupingInterval: 30000,
      }
    )
  })

  it('calls SWR with correct parameters for custom months', () => {
    mockUseSWR.mockReturnValue({
      data: mockPerformanceData,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    })

    renderHook(() => usePerformanceData(12))

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/dashboard/performance?months=12',
      expect.any(Function),
      {
        refreshInterval: 60000,
        revalidateOnFocus: true,
        dedupingInterval: 30000,
      }
    )
  })

  it('provides refresh function from SWR mutate', () => {
    const mockMutate = vi.fn()
    mockUseSWR.mockReturnValue({
      data: mockPerformanceData,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
      isValidating: false,
    })

    const { result } = renderHook(() => usePerformanceData())

    expect(result.current.refresh).toBe(mockMutate)
  })

  it('handles empty data response correctly', () => {
    const emptyResponse = {
      data: [],
      totalRevenue: 0,
      totalClients: 0,
      totalDeals: 0,
      averageConversionRate: 0,
    }

    mockUseSWR.mockReturnValue({
      data: emptyResponse,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    })

    const { result } = renderHook(() => usePerformanceData())

    expect(result.current.performanceData).toEqual([])
    expect(result.current.summary).toEqual({
      totalRevenue: 0,
      totalClients: 0,
      totalDeals: 0,
      averageConversionRate: 0,
    })
  })

  it('handles partial data response correctly', () => {
    const partialResponse = {
      data: [
        {
          month: 'Jan 2024',
          revenue: 15000,
          clients: 5,
          deals: 3,
          conversionRate: 60,
        },
      ],
      totalRevenue: 15000,
      totalClients: 5,
      totalDeals: 3,
      // Missing averageConversionRate
    }

    mockUseSWR.mockReturnValue({
      data: partialResponse,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    })

    const { result } = renderHook(() => usePerformanceData())

    expect(result.current.performanceData).toEqual(partialResponse.data)
    expect(result.current.summary).toEqual({
      totalRevenue: 15000,
      totalClients: 5,
      totalDeals: 3,
      averageConversionRate: 0, // Should default to 0
    })
  })

  it('fetcher function works correctly', async () => {
    // Get the fetcher function from the SWR call
    mockUseSWR.mockReturnValue({
      data: mockPerformanceData,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    })

    renderHook(() => usePerformanceData())

    const swrCall = mockUseSWR.mock.calls[0]
    const fetcher = swrCall[1]

    // Mock fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockPerformanceData),
    })
    global.fetch = mockFetch

    const result = await fetcher('/api/dashboard/performance?months=6')

    expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/performance?months=6')
    expect(result).toEqual(mockPerformanceData)
  })

  it('fetcher function handles fetch errors correctly', async () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
      isValidating: false,
    })

    renderHook(() => usePerformanceData())

    const swrCall = mockUseSWR.mock.calls[0]
    const fetcher = swrCall[1]

    // Mock failed fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })
    global.fetch = mockFetch

    await expect(fetcher('/api/dashboard/performance?months=6')).rejects.toThrow(
      'Failed to fetch performance data'
    )
  })
})