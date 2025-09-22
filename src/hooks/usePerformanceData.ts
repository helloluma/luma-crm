'use client'

import useSWR from 'swr'
import { PerformanceDataPoint } from '@/components/dashboard/PerformanceChart'

interface PerformanceDataResponse {
  data: PerformanceDataPoint[]
  totalRevenue: number
  totalClients: number
  totalDeals: number
  averageConversionRate: number
}

const fetcher = async (url: string): Promise<PerformanceDataResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch performance data')
  }
  return response.json()
}

export function usePerformanceData(months: number = 6) {
  const { data, error, isLoading, mutate } = useSWR<PerformanceDataResponse>(
    `/api/dashboard/performance?months=${months}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      dedupingInterval: 30000, // Dedupe requests within 30 seconds
    }
  )

  return {
    performanceData: data?.data || [],
    summary: {
      totalRevenue: data?.totalRevenue || 0,
      totalClients: data?.totalClients || 0,
      totalDeals: data?.totalDeals || 0,
      averageConversionRate: data?.averageConversionRate || 0,
    },
    loading: isLoading,
    error,
    refresh: mutate,
  }
}

export default usePerformanceData