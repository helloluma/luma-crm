import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PerformanceChart, PerformanceDataPoint } from '../PerformanceChart'

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}))

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Line: vi.fn(({ data, options, ...props }) => (
    <div 
      data-testid="performance-chart"
      data-chart-data={JSON.stringify(data)}
      data-chart-options={JSON.stringify(options)}
      {...props}
    >
      Mock Chart
    </div>
  )),
}))

describe('PerformanceChart', () => {
  const mockData: PerformanceDataPoint[] = [
    {
      month: 'Jan 2024',
      revenue: 15000,
      clients: 5,
      deals: 3,
      conversionRate: 60,
    },
    {
      month: 'Feb 2024',
      revenue: 22000,
      clients: 8,
      deals: 5,
      conversionRate: 75,
    },
    {
      month: 'Mar 2024',
      revenue: 18000,
      clients: 6,
      deals: 4,
      conversionRate: 67,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state correctly', () => {
    render(<PerformanceChart data={[]} loading={true} />)
    
    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
    expect(screen.queryByTestId('performance-chart')).not.toBeInTheDocument()
  })

  it('renders empty state when no data is provided', () => {
    render(<PerformanceChart data={[]} />)
    
    expect(screen.getByText('No performance data')).toBeInTheDocument()
    expect(screen.getByText('Performance data will appear here once you have transactions and clients.')).toBeInTheDocument()
    expect(screen.queryByTestId('performance-chart')).not.toBeInTheDocument()
  })

  it('renders chart with data correctly', () => {
    render(<PerformanceChart data={mockData} />)
    
    const chart = screen.getByTestId('performance-chart')
    expect(chart).toBeInTheDocument()
    expect(chart).toHaveAttribute('aria-label', 'Performance chart showing revenue, clients, deals, and conversion rate over time')
    expect(chart).toHaveAttribute('role', 'img')
  })

  it('processes chart data correctly', () => {
    render(<PerformanceChart data={mockData} />)
    
    const chart = screen.getByTestId('performance-chart')
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}')
    
    // Check labels
    expect(chartData.labels).toEqual(['Jan 2024', 'Feb 2024', 'Mar 2024'])
    
    // Check datasets
    expect(chartData.datasets).toHaveLength(4)
    
    // Revenue dataset
    const revenueDataset = chartData.datasets.find((ds: any) => ds.label === 'Revenue')
    expect(revenueDataset).toBeDefined()
    expect(revenueDataset.data).toEqual([15000, 22000, 18000])
    expect(revenueDataset.borderColor).toBe('rgb(59, 130, 246)')
    expect(revenueDataset.yAxisID).toBe('y')
    
    // Clients dataset
    const clientsDataset = chartData.datasets.find((ds: any) => ds.label === 'New Clients')
    expect(clientsDataset).toBeDefined()
    expect(clientsDataset.data).toEqual([5, 8, 6])
    expect(clientsDataset.borderColor).toBe('rgb(16, 185, 129)')
    expect(clientsDataset.yAxisID).toBe('y')
    
    // Deals dataset
    const dealsDataset = chartData.datasets.find((ds: any) => ds.label === 'Active Deals')
    expect(dealsDataset).toBeDefined()
    expect(dealsDataset.data).toEqual([3, 5, 4])
    expect(dealsDataset.borderColor).toBe('rgb(245, 158, 11)')
    expect(dealsDataset.yAxisID).toBe('y')
    
    // Conversion rate dataset
    const conversionDataset = chartData.datasets.find((ds: any) => ds.label === 'Conversion Rate')
    expect(conversionDataset).toBeDefined()
    expect(conversionDataset.data).toEqual([60, 75, 67])
    expect(conversionDataset.borderColor).toBe('rgb(239, 68, 68)')
    expect(conversionDataset.yAxisID).toBe('y1')
    expect(conversionDataset.borderDash).toEqual([5, 5])
  })

  it('configures chart options correctly', () => {
    render(<PerformanceChart data={mockData} />)
    
    const chart = screen.getByTestId('performance-chart')
    const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}')
    
    // Check responsive settings
    expect(chartOptions.responsive).toBe(true)
    expect(chartOptions.maintainAspectRatio).toBe(false)
    
    // Check interaction settings
    expect(chartOptions.interaction.mode).toBe('index')
    expect(chartOptions.interaction.intersect).toBe(false)
    
    // Check plugins
    expect(chartOptions.plugins.title.display).toBe(true)
    expect(chartOptions.plugins.title.text).toBe('Performance Overview')
    expect(chartOptions.plugins.legend.position).toBe('top')
    
    // Check scales
    expect(chartOptions.scales.y).toBeDefined()
    expect(chartOptions.scales.y1).toBeDefined()
    expect(chartOptions.scales.y1.position).toBe('right')
  })

  it('handles tooltip formatting correctly', () => {
    render(<PerformanceChart data={mockData} />)
    
    const chart = screen.getByTestId('performance-chart')
    expect(chart).toBeInTheDocument()
    
    // Since functions can't be serialized in JSON, we test that the chart renders
    // and the tooltip configuration is present in the options structure
    const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}')
    expect(chartOptions.plugins.tooltip).toBeDefined()
    expect(chartOptions.plugins.tooltip.callbacks).toBeDefined()
  })

  it('handles y-axis tick formatting correctly', () => {
    render(<PerformanceChart data={mockData} />)
    
    const chart = screen.getByTestId('performance-chart')
    const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}')
    
    // Test that y-axis configuration is present
    expect(chartOptions.scales.y).toBeDefined()
    expect(chartOptions.scales.y.ticks).toBeDefined()
    expect(chartOptions.scales.y1).toBeDefined()
    expect(chartOptions.scales.y1.ticks).toBeDefined()
    expect(chartOptions.scales.y1.position).toBe('right')
  })

  it('applies custom className correctly', () => {
    const customClass = 'custom-chart-class'
    render(<PerformanceChart data={mockData} className={customClass} />)
    
    const container = screen.getByTestId('performance-chart').parentElement?.parentElement
    expect(container).toHaveClass(customClass)
  })

  it('handles edge cases in data processing', () => {
    const edgeCaseData: PerformanceDataPoint[] = [
      {
        month: 'Jan 2024',
        revenue: 0,
        clients: 0,
        deals: 0,
        conversionRate: 0,
      },
    ]
    
    render(<PerformanceChart data={edgeCaseData} />)
    
    const chart = screen.getByTestId('performance-chart')
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}')
    
    // Check that zero values are handled correctly
    expect(chartData.datasets[0].data).toEqual([0]) // Revenue
    expect(chartData.datasets[1].data).toEqual([0]) // Clients
    expect(chartData.datasets[2].data).toEqual([0]) // Deals
    expect(chartData.datasets[3].data).toEqual([0]) // Conversion Rate
  })

  it('handles large numbers in data processing', () => {
    const largeNumberData: PerformanceDataPoint[] = [
      {
        month: 'Jan 2024',
        revenue: 1500000,
        clients: 100,
        deals: 50,
        conversionRate: 95,
      },
    ]
    
    render(<PerformanceChart data={largeNumberData} />)
    
    const chart = screen.getByTestId('performance-chart')
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}')
    
    // Check that large numbers are processed correctly
    expect(chartData.datasets[0].data).toEqual([1500000])
    
    // Test that chart configuration handles large numbers
    const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}')
    expect(chartOptions.scales.y.ticks).toBeDefined()
  })
})