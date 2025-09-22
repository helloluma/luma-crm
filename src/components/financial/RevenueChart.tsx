'use client'

import React, { useRef, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { RevenueData } from './RevenueAnalytics'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface RevenueChartProps {
  data: RevenueData
  showTrends?: boolean
  className?: string
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  showTrends = false, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)

  useEffect(() => {
    const loadChart = async () => {
      if (!canvasRef.current) return

      // Dynamically import Chart.js to avoid SSR issues
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)

      // Destroy existing chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }

      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      const chartData = {
        labels: data.monthlyLabels,
        datasets: [
          {
            label: 'Net Commission',
            data: data.monthlyRevenue,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          }
        ]
      }

      if (showTrends) {
        // Add trend line for comparison
        const trendData = calculateTrendLine(data.monthlyRevenue)
        chartData.datasets.push({
          label: 'Trend',
          data: trendData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0,
        })
      }

      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: showTrends ? 'Revenue Trends Analysis' : 'Monthly Revenue Performance',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              display: true,
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  const value = context.parsed.y
                  return `${context.dataset.label}: $${value.toLocaleString()}`
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Month'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Revenue ($)'
              },
              ticks: {
                callback: function(value) {
                  return '$' + Number(value).toLocaleString()
                }
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      })
    }

    loadChart()

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [data, showTrends])

  const trendDirection = calculateTrendDirection(data.monthlyRevenue)
  const trendPercentage = Math.abs(data.yearOverYearGrowth)

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {showTrends ? 'Revenue Trends' : 'Monthly Revenue'}
        </h3>
        
        {showTrends && (
          <div className="flex items-center gap-2">
            {trendDirection === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trendDirection === 'up' ? '+' : '-'}{trendPercentage.toFixed(1)}% YoY
            </span>
          </div>
        )}
      </div>

      <div className="relative h-80">
        <canvas ref={canvasRef} />
      </div>

      {showTrends && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500">Peak Month</p>
            <p className="text-lg font-semibold text-gray-900">
              {data.monthlyLabels[data.monthlyRevenue.indexOf(Math.max(...data.monthlyRevenue))]}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Peak Revenue</p>
            <p className="text-lg font-semibold text-gray-900">
              ${Math.max(...data.monthlyRevenue).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Average Monthly</p>
            <p className="text-lg font-semibold text-gray-900">
              ${(data.monthlyRevenue.reduce((a, b) => a + b, 0) / 12).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Growth Rate</p>
            <p className={`text-lg font-semibold ${
              data.yearOverYearGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.yearOverYearGrowth >= 0 ? '+' : ''}{data.yearOverYearGrowth.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

// Helper function to calculate trend line using linear regression
function calculateTrendLine(data: number[]): number[] {
  const n = data.length
  const x = Array.from({ length: n }, (_, i) => i)
  const y = data

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return x.map(xi => slope * xi + intercept)
}

// Helper function to determine trend direction
function calculateTrendDirection(data: number[]): 'up' | 'down' {
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  
  return secondHalfAvg > firstHalfAvg ? 'up' : 'down'
}

export default RevenueChart