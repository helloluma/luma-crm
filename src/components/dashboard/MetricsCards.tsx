'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui'
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface MetricData {
  id: string
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: 'users' | 'dollar' | 'target' | 'calendar'
  loading?: boolean
}

interface MetricsCardsProps {
  metrics?: MetricData[]
  loading?: boolean
  className?: string
}

const iconMap = {
  users: Users,
  dollar: DollarSign,
  target: Target,
  calendar: Calendar,
}

function MetricCard({ metric }: { metric: MetricData }) {
  const Icon = iconMap[metric.icon]
  
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        {metric.loading ? (
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {typeof metric.value === 'number' 
                    ? metric.value.toLocaleString() 
                    : metric.value
                  }
                </p>
                
                {metric.change !== undefined && (
                  <div className="flex items-center mt-2">
                    {metric.changeType === 'increase' && (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    )}
                    {metric.changeType === 'decrease' && (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={cn(
                      'text-sm font-medium',
                      metric.changeType === 'increase' && 'text-green-600',
                      metric.changeType === 'decrease' && 'text-red-600',
                      metric.changeType === 'neutral' && 'text-gray-600'
                    )}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function MetricsCards({ metrics = [], loading = false, className }: MetricsCardsProps) {
  const [displayMetrics, setDisplayMetrics] = useState<MetricData[]>([])

  useEffect(() => {
    if (loading) {
      // Show loading skeleton
      setDisplayMetrics([
        { id: '1', title: 'Loading...', value: 0, icon: 'users', loading: true },
        { id: '2', title: 'Loading...', value: 0, icon: 'target', loading: true },
        { id: '3', title: 'Loading...', value: 0, icon: 'dollar', loading: true },
        { id: '4', title: 'Loading...', value: 0, icon: 'calendar', loading: true },
      ])
    } else {
      setDisplayMetrics(metrics)
    }
  }, [metrics, loading])

  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
      className
    )}>
      {displayMetrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  )
}