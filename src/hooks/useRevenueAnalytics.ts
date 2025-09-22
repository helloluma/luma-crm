'use client'

import { useState, useEffect } from 'react'
import { Transaction } from '@/types'

export interface RevenueAnalyticsData {
  totalRevenue: number
  commissionRevenue: number
  closedDeals: number
  averageDealSize: number
  yearOverYearGrowth: number
  goalProgress: number
  monthlyRevenue: number[]
  monthlyLabels: string[]
  monthlyDeals: number[]
  quarterlyRevenue: number[]
  quarterlyLabels: string[]
  trendDirection: 'up' | 'down' | 'stable'
  metrics: {
    activeMonths: number
    peakMonth: string
    peakRevenue: number
    averageMonthly: number
    conversionRate: number
    averageCommissionRate: number
  }
}

export interface RevenueAnalyticsResponse {
  data: RevenueAnalyticsData
  transactions: Transaction[]
  dateRange: { from: string; to: string }
}

interface UseRevenueAnalyticsOptions {
  from?: string
  to?: string
  enabled?: boolean
}

interface UseRevenueAnalyticsReturn {
  data: RevenueAnalyticsResponse | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useRevenueAnalytics(options: UseRevenueAnalyticsOptions = {}): UseRevenueAnalyticsReturn {
  const {
    from = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to = new Date().toISOString().split('T')[0],
    enabled = true
  } = options

  const [data, setData] = useState<RevenueAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchRevenueAnalytics = async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        from,
        to
      })

      const response = await fetch(`/api/dashboard/revenue?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch revenue analytics')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      console.error('Error fetching revenue analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenueAnalytics()
  }, [from, to, enabled])

  return {
    data,
    isLoading,
    error,
    refetch: fetchRevenueAnalytics
  }
}

export default useRevenueAnalytics