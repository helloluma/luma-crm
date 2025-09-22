import React from 'react'
import { render, screen } from '@testing-library/react'
import RevenueMetrics from '../RevenueMetrics'
import { RevenueData } from '../RevenueAnalytics'

describe('RevenueMetrics', () => {
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

  it('should render all metric cards', () => {
    render(<RevenueMetrics data={mockRevenueData} />)

    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('Gross Commission')).toBeInTheDocument()
    expect(screen.getByText('Closed Deals')).toBeInTheDocument()
    expect(screen.getByText('Average Deal Size')).toBeInTheDocument()
  })

  it('should format currency values correctly', () => {
    render(<RevenueMetrics data={mockRevenueData} />)

    expect(screen.getByText('$150,000')).toBeInTheDocument() // Total Revenue
    expect(screen.getByText('$180,000')).toBeInTheDocument() // Gross Commission
    expect(screen.getByText('$12,500')).toBeInTheDocument() // Average Deal Size
  })

  it('should format number values correctly', () => {
    render(<RevenueMetrics data={mockRevenueData} />)

    expect(screen.getByText('12')).toBeInTheDocument() // Closed Deals
  })

  it('should show comparison data when showComparison is true', () => {
    render(<RevenueMetrics data={mockRevenueData} showComparison />)

    expect(screen.getByText('Performance Comparison')).toBeInTheDocument()
    expect(screen.getByText('Goal Achievement')).toBeInTheDocument()
    expect(screen.getByText('Year-over-Year Growth')).toBeInTheDocument()
    expect(screen.getByText('Active Months')).toBeInTheDocument()
  })

  it('should display positive year-over-year growth correctly', () => {
    render(<RevenueMetrics data={mockRevenueData} showComparison />)

    expect(screen.getByText('+15.5%')).toBeInTheDocument()
    expect(screen.getByText('+15.5%')).toHaveClass('text-green-600')
    expect(screen.getByText('Above last year\'s performance')).toBeInTheDocument()
  })

  it('should display negative year-over-year growth correctly', () => {
    const negativeGrowthData = {
      ...mockRevenueData,
      yearOverYearGrowth: -8.2
    }

    render(<RevenueMetrics data={negativeGrowthData} showComparison />)

    expect(screen.getByText('-8.2%')).toBeInTheDocument()
    expect(screen.getByText('-8.2%')).toHaveClass('text-red-600')
    expect(screen.getByText('Below last year\'s performance')).toBeInTheDocument()
  })

  it('should display goal progress correctly', () => {
    render(<RevenueMetrics data={mockRevenueData} showComparison />)

    expect(screen.getByText('30.0%')).toBeInTheDocument()
    
    // Check progress bar width
    const progressBar = document.querySelector('.bg-blue-600')
    expect(progressBar).toHaveStyle('width: 30%')
  })

  it('should cap goal progress at 100%', () => {
    const overAchievingData = {
      ...mockRevenueData,
      goalProgress: 150.0
    }

    render(<RevenueMetrics data={overAchievingData} showComparison />)

    const progressBar = document.querySelector('.bg-blue-600')
    expect(progressBar).toHaveStyle('width: 100%')
  })

  it('should calculate active months correctly', () => {
    render(<RevenueMetrics data={mockRevenueData} showComparison />)

    // All 12 months have revenue > 0 in mock data
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('should handle zero values gracefully', () => {
    const zeroData = {
      ...mockRevenueData,
      totalRevenue: 0,
      commissionRevenue: 0,
      closedDeals: 0,
      averageDealSize: 0,
      yearOverYearGrowth: 0,
      goalProgress: 0
    }

    render(<RevenueMetrics data={zeroData} />)

    expect(screen.getByText('$0')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <RevenueMetrics data={mockRevenueData} className="custom-metrics-class" />
    )

    expect(container.firstChild).toHaveClass('custom-metrics-class')
  })

  it('should show metric descriptions', () => {
    render(<RevenueMetrics data={mockRevenueData} />)

    expect(screen.getByText('Net commission earned')).toBeInTheDocument()
    expect(screen.getByText('Total commission before splits')).toBeInTheDocument()
    expect(screen.getByText('Successfully closed transactions')).toBeInTheDocument()
    expect(screen.getByText('Average commission per deal')).toBeInTheDocument()
  })

  it('should display change indicators when showComparison is true', () => {
    render(<RevenueMetrics data={mockRevenueData} showComparison />)

    // Should show change percentages for each metric
    const changeElements = screen.getAllByText(/vs last year/)
    expect(changeElements).toHaveLength(4) // One for each metric
  })

  it('should handle large numbers with proper formatting', () => {
    const largeNumberData = {
      ...mockRevenueData,
      totalRevenue: 1500000,
      commissionRevenue: 1800000,
      closedDeals: 120,
      averageDealSize: 125000
    }

    render(<RevenueMetrics data={largeNumberData} />)

    expect(screen.getByText('$1,500,000')).toBeInTheDocument()
    expect(screen.getByText('$1,800,000')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('$125,000')).toBeInTheDocument()
  })

  it('should show correct icon colors for each metric', () => {
    render(<RevenueMetrics data={mockRevenueData} />)

    // Check that icons have the correct color classes
    const icons = document.querySelectorAll('[class*="text-"][class*="-600"]')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('should handle months with no revenue in active months calculation', () => {
    const sparseData = {
      ...mockRevenueData,
      monthlyRevenue: [10000, 0, 0, 0, 18000, 0, 0, 0, 0, 0, 21000, 0]
    }

    render(<RevenueMetrics data={sparseData} showComparison />)

    // Only 3 months have revenue > 0
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should show hover effects on metric cards', () => {
    render(<RevenueMetrics data={mockRevenueData} />)

    const cards = document.querySelectorAll('.hover\\:shadow-lg')
    expect(cards.length).toBe(4) // One for each metric card
  })
})