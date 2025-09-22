import { render, screen } from '@testing-library/react'
import { MetricsCards, MetricData } from '../MetricsCards'

const mockMetrics: MetricData[] = [
  {
    id: 'total-clients',
    title: 'Total Clients',
    value: 150,
    change: 12,
    changeType: 'increase',
    icon: 'users',
  },
  {
    id: 'active-deals',
    title: 'Active Deals',
    value: 25,
    change: -5,
    changeType: 'decrease',
    icon: 'target',
  },
  {
    id: 'monthly-revenue',
    title: 'Monthly Revenue',
    value: '$45,000',
    change: 8,
    changeType: 'increase',
    icon: 'dollar',
  },
  {
    id: 'conversion-rate',
    title: 'Conversion Rate',
    value: '18%',
    change: 0,
    changeType: 'neutral',
    icon: 'calendar',
  },
]

describe('MetricsCards', () => {
  it('renders all metric cards with correct data', () => {
    render(<MetricsCards metrics={mockMetrics} />)
    
    expect(screen.getByText('Total Clients')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('+12%')).toBeInTheDocument()
    
    expect(screen.getByText('Active Deals')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('-5%')).toBeInTheDocument()
    
    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
    expect(screen.getByText('$45,000')).toBeInTheDocument()
    expect(screen.getByText('+8%')).toBeInTheDocument()
    
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
    expect(screen.getByText('18%')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('displays loading skeleton when loading prop is true', () => {
    render(<MetricsCards loading={true} />)
    
    const loadingElements = screen.getAllByText('Loading...')
    expect(loadingElements).toHaveLength(4)
    
    // Check for loading animation classes
    const skeletonElements = document.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('handles empty metrics array', () => {
    render(<MetricsCards metrics={[]} />)
    
    // Should render empty grid
    const container = document.querySelector('.grid')
    expect(container).toBeInTheDocument()
    expect(container?.children).toHaveLength(0)
  })

  it('formats numeric values correctly', () => {
    const metricsWithLargeNumbers: MetricData[] = [
      {
        id: 'large-number',
        title: 'Large Number',
        value: 1234567,
        icon: 'users',
      },
    ]
    
    render(<MetricsCards metrics={metricsWithLargeNumbers} />)
    
    // Should format with commas
    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })

  it('displays correct trend indicators', () => {
    render(<MetricsCards metrics={mockMetrics} />)
    
    // Check for trend icons (using data-testid or class names)
    const container = document.querySelector('.grid')
    expect(container).toBeInTheDocument()
    
    // Verify trend colors are applied correctly
    const increaseElements = document.querySelectorAll('.text-green-600')
    const decreaseElements = document.querySelectorAll('.text-red-600')
    const neutralElements = document.querySelectorAll('.text-gray-600')
    
    expect(increaseElements.length).toBeGreaterThan(0)
    expect(decreaseElements.length).toBeGreaterThan(0)
    expect(neutralElements.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const customClass = 'custom-metrics-class'
    render(<MetricsCards metrics={mockMetrics} className={customClass} />)
    
    const container = document.querySelector(`.${customClass}`)
    expect(container).toBeInTheDocument()
  })

  it('renders without change data', () => {
    const metricsWithoutChange: MetricData[] = [
      {
        id: 'no-change',
        title: 'No Change Data',
        value: 100,
        icon: 'users',
      },
    ]
    
    render(<MetricsCards metrics={metricsWithoutChange} />)
    
    expect(screen.getByText('No Change Data')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    
    // Should not display change percentage
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })
})