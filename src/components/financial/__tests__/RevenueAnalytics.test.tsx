import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import RevenueAnalytics from '../RevenueAnalytics'
import { useRevenueAnalytics } from '@/hooks/useRevenueAnalytics'

// Mock the hook
vi.mock('@/hooks/useRevenueAnalytics')
const mockUseRevenueAnalytics = vi.mocked(useRevenueAnalytics)

// Mock Chart.js to avoid canvas issues in tests
vi.mock('chart.js', () => ({
  Chart: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
  })),
  registerables: [],
}))

describe('RevenueAnalytics', () => {
  const mockRevenueData = {
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
  }

  const mockTransactions = [
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
  ]

  const mockAnalyticsResponse = {
    data: mockRevenueData,
    transactions: mockTransactions,
    dateRange: { from: '2024-01-01', to: '2024-12-31' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state', () => {
    mockUseRevenueAnalytics.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn()
    })

    render(<RevenueAnalytics />)

    expect(screen.getByText('Revenue Analytics')).toBeInTheDocument()
    // Check for loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render error state', () => {
    const mockError = new Error('Failed to load data')
    mockUseRevenueAnalytics.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
      refetch: vi.fn()
    })

    render(<RevenueAnalytics />)

    expect(screen.getByText('Error loading revenue analytics: Failed to load data')).toBeInTheDocument()
  })

  it('should render no data state', () => {
    mockUseRevenueAnalytics.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    })

    render(<RevenueAnalytics />)

    expect(screen.getByText('No revenue data available for the selected period.')).toBeInTheDocument()
  })

  it('should render revenue analytics with data', () => {
    mockUseRevenueAnalytics.mockReturnValue({
      data: mockAnalyticsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    })

    render(<RevenueAnalytics />)

    expect(screen.getByText('Revenue Analytics')).toBeInTheDocument()
    expect(screen.getByText('Track your financial performance and goals')).toBeInTheDocument()
    
    // Check for tab navigation
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Goals')).toBeInTheDocument()
    expect(screen.getByText('Trends')).toBeInTheDocument()
    
    // Check for export button
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('should handle date range changes', async () => {
    const mockRefetch = vi.fn()
    mockUseRevenueAnalytics.mockReturnValue({
      data: mockAnalyticsResponse,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    })

    render(<RevenueAnalytics />)

    const fromDateInput = screen.getAllByDisplayValue('2024-01-01')[0]
    const toDateInput = screen.getAllByDisplayValue('2024-12-31')[0]

    fireEvent.change(fromDateInput, { target: { value: '2024-06-01' } })
    fireEvent.change(toDateInput, { target: { value: '2024-06-30' } })

    // The hook should be called with new date range
    await waitFor(() => {
      expect(mockUseRevenueAnalytics).toHaveBeenCalledWith({
        from: '2024-06-01',
        to: '2024-06-30'
      })
    })
  })

  it('should switch between tabs', () => {
    mockUseRevenueAnalytics.mockReturnValue({
      data: mockAnalyticsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    })

    render(<RevenueAnalytics />)

    // Initially on Overview tab
    expect(screen.getByText('Overview')).toHaveClass('text-blue-600')

    // Click Goals tab
    fireEvent.click(screen.getByText('Goals'))
    expect(screen.getByText('Goals')).toHaveClass('text-blue-600')
    expect(screen.getByText('Goal Tracking')).toBeInTheDocument()

    // Click Trends tab
    fireEvent.click(screen.getByText('Trends'))
    expect(screen.getByText('Trends')).toHaveClass('text-blue-600')
  })

  it('should render with custom className', () => {
    mockUseRevenueAnalytics.mockReturnValue({
      data: mockAnalyticsResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    })

    const { container } = render(<RevenueAnalytics className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should use current year as default date range', () => {
    const currentYear = new Date().getFullYear()
    const today = new Date().toISOString().split('T')[0]

    mockUseRevenueAnalytics.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn()
    })

    render(<RevenueAnalytics />)

    expect(mockUseRevenueAnalytics).toHaveBeenCalledWith({
      from: `${currentYear}-01-01`,
      to: today
    })
  })
})