'use client'

import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { usePerformanceData } from '@/hooks/usePerformanceData'

export default function DashboardPage() {
  const { metrics, loading: metricsLoading } = useDashboardMetrics()
  const { performanceData, loading: performanceLoading, summary } = usePerformanceData()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Overview of your real estate business performance
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="mb-8">
            <MetricsCards metrics={metrics} loading={metricsLoading} />
          </div>

          {/* Performance Chart */}
          <div className="mb-8">
            <PerformanceChart 
              data={performanceData} 
              loading={performanceLoading}
              className="w-full"
            />
          </div>

          {/* Performance Summary, Activity Feed, and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Performance Summary */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    ${summary.totalRevenue.toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Clients</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.totalClients}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Deals</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.totalDeals}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Conversion Rate</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.averageConversionRate}%
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="lg:col-span-1">
              <ActivityFeed limit={8} className="h-fit max-h-96 overflow-hidden" />
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <QuickActions className="h-fit" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}