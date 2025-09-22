'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { RevenueData } from './RevenueAnalytics'
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

interface RevenueMetricsProps {
  data: RevenueData
  showComparison?: boolean
  className?: string
}

export const RevenueMetrics: React.FC<RevenueMetricsProps> = ({ 
  data, 
  showComparison = false, 
  className = '' 
}) => {
  const metrics = [
    {
      id: 'total-revenue',
      title: 'Total Revenue',
      value: data.totalRevenue,
      format: 'currency',
      icon: DollarSign,
      color: 'blue',
      change: data.yearOverYearGrowth,
      description: 'Net commission earned'
    },
    {
      id: 'gross-commission',
      title: 'Gross Commission',
      value: data.commissionRevenue,
      format: 'currency',
      icon: Calculator,
      color: 'green',
      change: data.yearOverYearGrowth * 0.8, // Approximate
      description: 'Total commission before splits'
    },
    {
      id: 'closed-deals',
      title: 'Closed Deals',
      value: data.closedDeals,
      format: 'number',
      icon: Target,
      color: 'purple',
      change: 15.2, // Mock data
      description: 'Successfully closed transactions'
    },
    {
      id: 'average-deal',
      title: 'Average Deal Size',
      value: data.averageDealSize,
      format: 'currency',
      icon: TrendingUp,
      color: 'orange',
      change: -5.8, // Mock data
      description: 'Average commission per deal'
    }
  ]

  const formatValue = (value: number, format: 'currency' | 'number' | 'percentage') => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'number':
        return value.toLocaleString()
      default:
        return value.toString()
    }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return ArrowUpRight
    if (change < 0) return ArrowDownRight
    return Minus
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric) => {
        const Icon = metric.icon
        const ChangeIcon = getChangeIcon(metric.change)
        
        return (
          <Card key={metric.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${getIconColor(metric.color)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">
                    {metric.title}
                  </h3>
                </div>
                
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatValue(metric.value, metric.format)}
                  </p>
                  
                  {showComparison && (
                    <div className="flex items-center gap-1">
                      <ChangeIcon className={`h-4 w-4 ${getChangeColor(metric.change)}`} />
                      <span className={`text-sm font-medium ${getChangeColor(metric.change)}`}>
                        {Math.abs(metric.change).toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-500">vs last year</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    {metric.description}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
      
      {showComparison && (
        <Card className="p-6 md:col-span-2 lg:col-span-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {formatValue(data.goalProgress, 'percentage')}
              </div>
              <p className="text-sm text-gray-600">Goal Achievement</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(data.goalProgress, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${
                data.yearOverYearGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.yearOverYearGrowth >= 0 ? '+' : ''}{data.yearOverYearGrowth.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Year-over-Year Growth</p>
              <p className="text-xs text-gray-500 mt-1">
                {data.yearOverYearGrowth >= 0 ? 'Above' : 'Below'} last year's performance
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {data.monthlyRevenue.filter(m => m > 0).length}
              </div>
              <p className="text-sm text-gray-600">Active Months</p>
              <p className="text-xs text-gray-500 mt-1">
                Months with closed deals
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default RevenueMetrics