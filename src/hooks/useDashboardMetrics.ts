'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { MetricData } from '@/components/dashboard/MetricsCards'

interface DashboardMetricsData {
  totalClients: number
  activeDeals: number
  monthlyRevenue: number
  conversionRate: number
  previousMonth: {
    totalClients: number
    activeDeals: number
    monthlyRevenue: number
    conversionRate: number
  }
}

const fetcher = async (url: string): Promise<DashboardMetricsData> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch metrics')
  }
  return response.json()
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function getChangeType(change: number): 'increase' | 'decrease' | 'neutral' {
  if (change > 0) return 'increase'
  if (change < 0) return 'decrease'
  return 'neutral'
}

export function useDashboardMetrics() {
  const { data, error, isLoading, mutate } = useSWR<DashboardMetricsData>(
    '/api/dashboard/metrics',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  const [metrics, setMetrics] = useState<MetricData[]>([])

  useEffect(() => {
    if (data) {
      const clientsChange = calculateChange(data.totalClients, data.previousMonth.totalClients)
      const dealsChange = calculateChange(data.activeDeals, data.previousMonth.activeDeals)
      const revenueChange = calculateChange(data.monthlyRevenue, data.previousMonth.monthlyRevenue)
      const conversionChange = calculateChange(data.conversionRate, data.previousMonth.conversionRate)

      setMetrics([
        {
          id: 'total-clients',
          title: 'Total Clients',
          value: data.totalClients,
          change: clientsChange,
          changeType: getChangeType(clientsChange),
          icon: 'users',
        },
        {
          id: 'active-deals',
          title: 'Active Deals',
          value: data.activeDeals,
          change: dealsChange,
          changeType: getChangeType(dealsChange),
          icon: 'target',
        },
        {
          id: 'monthly-revenue',
          title: 'Monthly Revenue',
          value: `$${data.monthlyRevenue.toLocaleString()}`,
          change: revenueChange,
          changeType: getChangeType(revenueChange),
          icon: 'dollar',
        },
        {
          id: 'conversion-rate',
          title: 'Conversion Rate',
          value: `${data.conversionRate}%`,
          change: conversionChange,
          changeType: getChangeType(conversionChange),
          icon: 'calendar',
        },
      ])
    }
  }, [data])

  return {
    metrics,
    loading: isLoading,
    error,
    refresh: mutate,
  }
}