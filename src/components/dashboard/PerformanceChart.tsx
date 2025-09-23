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
  LineController,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController
)

interface PerformanceChartProps {
  className?: string
}

export default function PerformanceChart({ className }: PerformanceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS<'line'> | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Destroy existing chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    chartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: ['01 Jun', '02 Jun', '03 Jun', '04 Jun', '05 Jun', '06 Jun', '07 Jun', '08 Jun', '09 Jun', '10 Jun'],
        datasets: [{
          label: 'Transactions Created',
          data: [8500, 6000, 7500, 9500, 7000, 4000, 6000, 5000, 8000, 5000],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }, {
          label: 'Avg Setup Time',
          data: [3500, 4000, 6000, 4500, 1500, 2000, 3000, 3800, 4000, 3500],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              borderDash: [2],
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: { size: 12 },
              color: '#6B7280'
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 12 },
              color: '#6B7280'
            }
          }
        },
        elements: {
          point: {
            radius: 0,
            hoverRadius: 6
          }
        }
      }
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [])

  return (
    <div className={className}>
      <canvas ref={canvasRef} />
    </div>
  )
}