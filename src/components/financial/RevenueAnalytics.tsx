'use client'

import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { RevenueChart } from './RevenueChart'
import { GoalTracker } from './GoalTracker'
import { RevenueMetrics } from './RevenueMetrics'
import { RevenueExport } from './RevenueExport'
import { useRevenueAnalytics } from '@/hooks/useRevenueAnalytics'
import { Transaction } from '@/types'
import { Calendar, TrendingUp, Target, Download } from 'lucide-react'

interface RevenueAnalyticsProps {
  className?: string
}

export interface RevenueData {
  totalRevenue: number
  monthlyRevenue: number[]
  monthlyLabels: string[]
  commissionRevenue: number
  goalProgress: number
  yearOverYearGrowth: number
  averageDealSize: number
  closedDeals: number
}

export interface GoalData {
  id: string
  title: string
  target: number
  current: number
  deadline: string
  type: 'revenue' | 'deals' | 'commission'
}

const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ className = '' }) => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'trends'>('overview')

  const { data: analyticsResponse, isLoading, error } = useRevenueAnalytics({
    from: dateRange.from,
    to: dateRange.to
  })

  const revenueData = analyticsResponse?.data || null
  const transactions = analyticsResponse?.transactions || []

  const goalData = useMemo(() => {
    return getGoalData(revenueData)
  }, [revenueData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded mt-6"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading revenue analytics: {error.message}</p>
        </div>
      </Card>
    )
  }

  if (!revenueData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>No revenue data available for the selected period.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Analytics</h2>
          <p className="text-gray-600">Track your financial performance and goals</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <RevenueExport 
            data={revenueData} 
            transactions={transactions}
            dateRange={dateRange}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'trends', label: 'Trends', icon: Calendar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <RevenueMetrics data={revenueData} />
          <RevenueChart data={revenueData} />
        </div>
      )}

      {activeTab === 'goals' && (
        <GoalTracker goals={goalData} revenueData={revenueData} />
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <RevenueChart data={revenueData} showTrends />
          <RevenueMetrics data={revenueData} showComparison />
        </div>
      )}
    </div>
  )
}



// Helper function to generate goal data
function getGoalData(revenueData: RevenueData | null): GoalData[] {
  if (!revenueData) return []

  const currentYear = new Date().getFullYear()
  
  return [
    {
      id: '1',
      title: 'Annual Revenue Goal',
      target: 500000,
      current: revenueData.totalRevenue,
      deadline: `${currentYear}-12-31`,
      type: 'revenue'
    },
    {
      id: '2',
      title: 'Quarterly Deals',
      target: 25,
      current: revenueData.closedDeals,
      deadline: `${currentYear}-12-31`,
      type: 'deals'
    },
    {
      id: '3',
      title: 'Commission Target',
      target: 600000,
      current: revenueData.commissionRevenue,
      deadline: `${currentYear}-12-31`,
      type: 'commission'
    }
  ]
}

export default RevenueAnalytics