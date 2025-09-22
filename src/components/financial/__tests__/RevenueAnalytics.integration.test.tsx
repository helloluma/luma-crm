import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import RevenueAnalytics from '../RevenueAnalytics'

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
  })),
  registerables: [],
}))

// Mock the hook with realistic data
vi.mock('@/hooks/useRevenueAnalytics', () => ({
  useRevenueAnalytics: vi.fn(() => ({
    data: {
      data: {
        totalRevenue: 150000,
        commissionRevenue: 180000,
        closedDeals: 12,
        averageDealSize: 12500,
        yearOverYearGrowth: 15.5,
        goalProgress: 30.0,
        monthlyRevenue: [10000, 15000, 20000, 12000, 18000, 25000, 22000, 16000, 14000, 19000, 21000, 8000],
        monthlyLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        monthlyDeals: [1, 2, 2, 1, 2, 3, 2, 1, 1, 2, 2, 1],
        quarterlyRevenue: [45000, 55000, 52000, 48000],
        quarterlyLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
        trendDirection: 'up' as const,
        metrics: {
          activeMonths: 12,
          peakMonth: 'Jun',
          peakRevenue: 25000,
          averageMonthly: 16666.67,
          conversionRate: 0.15,
          averageCommissionRate: 2.75
        }
      },
      transactions: [
        {
          id: 'trans-1',
          address: '123 Main St',
          price: 500000,
          commission_rate: 3,
          gross_commission: 15000,
          net_commission: 12000,
          broker_commission: 3000,
          status: 'Closed',
          closing_date: '2024-06-15',
          created_at: '2024-06-01T00:00:00Z'
        }
      ],
      dateRange: { from: '2024-01-01', to: '2024-12-31' }
    },
    isLoading: false,
    error: null,
    refetch: vi.fn()
  }))
}))

describe('RevenueAnalytics Integration', () => {
  it('should render complete revenue analytics dashboard', () => {
    render(<RevenueAnalytics />)

    // Check main components are rendered
    expect(screen.getByText('Revenue Analytics')).toBeInTheDocument()
    expect(screen.getByText('Track your financial performance and goals')).toBeInTheDocument()
    
    // Check tabs
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Goals')).toBeInTheDocument()
    expect(screen.getByText('Trends')).toBeInTheDocument()
    
    // Check export functionality
    expect(screen.getByText('Export')).toBeInTheDocument()
    
    // Check date range inputs
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument()
  })

  it('should display revenue metrics correctly', () => {
    render(<RevenueAnalytics />)

    // Check that revenue metrics are displayed
    expect(screen.getByText('$150,000')).toBeInTheDocument() // Total Revenue
    expect(screen.getByText('$180,000')).toBeInTheDocument() // Gross Commission
    expect(screen.getByText('12')).toBeInTheDocument() // Closed Deals
    expect(screen.getByText('$12,500')).toBeInTheDocument() // Average Deal Size
  })
})