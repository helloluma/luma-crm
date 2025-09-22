'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export interface PerformanceDataPoint {
  month: string
  revenue: number
  clients: number
  deals: number
  conversionRate: number
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[]
  loading?: boolean
  className?: string
}

export function PerformanceChart({ data, loading = false, className = '' }: PerformanceChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null)

  // Chart configuration
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Performance Overview',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#1f2937',
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => {
            return `${context[0].label}`
          },
          label: (context) => {
            const datasetLabel = context.dataset.label || ''
            const value = context.parsed.y
            
            if (datasetLabel === 'Revenue') {
              return `${datasetLabel}: $${value.toLocaleString()}`
            } else if (datasetLabel === 'Conversion Rate') {
              return `${datasetLabel}: ${value}%`
            } else {
              return `${datasetLabel}: ${value}`
            }
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue ($) / Clients / Deals',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            if (typeof value === 'number') {
              return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
            }
            return value
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Conversion Rate (%)',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return `${value}%`
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  }

  // Prepare chart data
  const chartData: ChartData<'line'> = {
    labels: data.map(point => point.month),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(point => point.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        yAxisID: 'y',
        tension: 0.4,
      },
      {
        label: 'New Clients',
        data: data.map(point => point.clients),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: false,
        yAxisID: 'y',
        tension: 0.4,
      },
      {
        label: 'Active Deals',
        data: data.map(point => point.deals),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: false,
        yAxisID: 'y',
        tension: 0.4,
      },
      {
        label: 'Conversion Rate',
        data: data.map(point => point.conversionRate),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        yAxisID: 'y1',
        tension: 0.4,
        borderDash: [5, 5],
      },
    ],
  }

  // Handle chart resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse" data-testid="loading-state">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No performance data</h3>
          <p className="text-sm text-gray-500">Performance data will appear here once you have transactions and clients.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="h-80">
        <Line
          ref={chartRef}
          data={chartData}
          options={options}
          aria-label="Performance chart showing revenue, clients, deals, and conversion rate over time"
          role="img"
        />
      </div>
    </div>
  )
}

export default PerformanceChart