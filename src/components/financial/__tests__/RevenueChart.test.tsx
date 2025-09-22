import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import RevenueChart from '../RevenueChart'
import { RevenueData } from '../RevenueAnalytics'

// Mock Chart.js
const mockChart = {
  destroy: vi.fn(),
  update: vi.fn(),
}

vi.mock('chart.js', () => ({
  Chart: vi.fn().mockImplementation(() => mockChart),
  registerables: [],
}))

describe('RevenueChart', () => {
  const mockRevenueData: RevenueData = {
    totalRevenue: 150000,
    commissionRevenue: 180000,
    closedDeals: 12,
    averageDealSize: 12500,
    yearOverYearGrowth: 15.5,
    goalProgress: 30.0,
    monthlyRevenue: [10000, 15000, 20000, 12000, 18000, 25000, 22000, 16000, 14000, 19000, 21000, 8000],
    monthlyLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render revenue chart with basic data', () => {
    render(<RevenueChart data={mockRevenueData} />)

    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument() // Canvas element
  })

  it('should render trends chart when showTrends is true', () => {
    render(<RevenueChart data={mockRevenueData} showTrends />)

    expect(screen.getByText('Revenue Trends')).toBeInTheDocument()
    expect(screen.getByText('+15.5% YoY')).toBeInTheDocument()
  })

  it('should display trend direction correctly for positive growth', () => {
    render(<RevenueChart data={mockRevenueData} showTrends />)

    expect(screen.getByText('+15.5% YoY')).toBeInTheDocument()
    expect(screen.getByText('+15.5% YoY')).toHaveClass('text-green-600')
  })

  it('should display trend direction correctly for negative growth', () => {
    const negativeGrowthData = {
      ...mockRevenueData,
      yearOverYearGrowth: -8.2
    }

    render(<RevenueChart data={negativeGrowthData} showTrends />)

    expect(screen.getByText('-8.2% YoY')).toBeInTheDocument()
    expect(screen.getByText('-8.2% YoY')).toHaveClass('text-red-600')
  })

  it('should show trend analysis when showTrends is enabled', () => {
    render(<RevenueChart data={mockRevenueData} showTrends />)

    expect(screen.getByText('Peak Month')).toBeInTheDocument()
    expect(screen.getByText('Peak Revenue')).toBeInTheDocument()
    expect(screen.getByText('Average Monthly')).toBeInTheDocument()
    expect(screen.getByText('Growth Rate')).toBeInTheDocument()
  })

  it('should calculate peak month correctly', () => {
    render(<RevenueChart data={mockRevenueData} showTrends />)

    // Peak revenue is 25000 in June (index 5)
    expect(screen.getByText('Jun')).toBeInTheDocument()
    expect(screen.getByText('$25,000')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <RevenueChart data={mockRevenueData} className="custom-chart-class" />
    )

    expect(container.firstChild).toHaveClass('custom-chart-class')
  })

  it('should destroy existing chart when component unmounts', () => {
    const { unmount } = render(<RevenueChart data={mockRevenueData} />)

    unmount()

    expect(mockChart.destroy).toHaveBeenCalled()
  })

  it('should handle empty revenue data', () => {
    const emptyData = {
      ...mockRevenueData,
      monthlyRevenue: Array(12).fill(0),
      totalRevenue: 0,
      closedDeals: 0
    }

    render(<RevenueChart data={emptyData} showTrends />)

    expect(screen.getByText('Revenue Trends')).toBeInTheDocument()
    expect(screen.getByText('$0')).toBeInTheDocument() // Peak revenue
  })
})