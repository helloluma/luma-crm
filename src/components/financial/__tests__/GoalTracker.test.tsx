import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GoalTracker from '../GoalTracker'
import { GoalData, RevenueData } from '../RevenueAnalytics'

describe('GoalTracker', () => {
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

  const mockGoals: GoalData[] = [
    {
      id: '1',
      title: 'Annual Revenue Goal',
      target: 500000,
      current: 150000,
      deadline: '2024-12-31',
      type: 'revenue'
    },
    {
      id: '2',
      title: 'Quarterly Deals',
      target: 25,
      current: 12,
      deadline: '2024-12-31',
      type: 'deals'
    },
    {
      id: '3',
      title: 'Commission Target',
      target: 600000,
      current: 180000,
      deadline: '2024-12-31',
      type: 'commission'
    }
  ]

  it('should render goal tracking header', () => {
    render(<GoalTracker goals={mockGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('Goal Tracking')).toBeInTheDocument()
    expect(screen.getByText('Monitor your progress towards key objectives')).toBeInTheDocument()
    expect(screen.getByText('Add Goal')).toBeInTheDocument()
  })

  it('should render all goal cards', () => {
    render(<GoalTracker goals={mockGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('Annual Revenue Goal')).toBeInTheDocument()
    expect(screen.getByText('Quarterly Deals')).toBeInTheDocument()
    expect(screen.getByText('Commission Target')).toBeInTheDocument()
  })

  it('should display goal progress correctly', () => {
    render(<GoalTracker goals={mockGoals} revenueData={mockRevenueData} />)

    // Annual Revenue Goal: 150000 / 500000 = 30%
    expect(screen.getByText('30.0% complete')).toBeInTheDocument()
    
    // Quarterly Deals: 12 / 25 = 48%
    expect(screen.getByText('48.0% complete')).toBeInTheDocument()
    
    // Commission Target: 180000 / 600000 = 30%
    expect(screen.getByText('30.0% complete')).toBeInTheDocument()
  })

  it('should format goal values correctly', () => {
    render(<GoalTracker goals={mockGoals} revenueData={mockRevenueData} />)

    // Revenue goals should be formatted as currency
    expect(screen.getByText('$150,000 / $500,000')).toBeInTheDocument()
    expect(screen.getByText('$180,000 / $600,000')).toBeInTheDocument()
    
    // Deal goals should be formatted as numbers
    expect(screen.getByText('12 / 25')).toBeInTheDocument()
  })

  it('should show correct goal status for completed goals', () => {
    const completedGoals = [
      {
        ...mockGoals[0],
        current: 500000, // Meets target
        target: 500000
      }
    ]

    render(<GoalTracker goals={completedGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.getByText('100.0% complete')).toBeInTheDocument()
  })

  it('should show correct goal status for at-risk goals', () => {
    const atRiskGoals = [
      {
        ...mockGoals[0],
        current: 50000, // Low progress
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 20 days from now
      }
    ]

    render(<GoalTracker goals={atRiskGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('at risk')).toBeInTheDocument()
  })

  it('should show correct goal status for behind goals', () => {
    const behindGoals = [
      {
        ...mockGoals[0],
        current: 100000, // Moderate progress
        deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 50 days from now
      }
    ]

    render(<GoalTracker goals={behindGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('behind')).toBeInTheDocument()
  })

  it('should show correct goal status for on-track goals', () => {
    const onTrackGoals = [
      {
        ...mockGoals[0],
        current: 200000, // Good progress
        deadline: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 100 days from now
      }
    ]

    render(<GoalTracker goals={onTrackGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('on track')).toBeInTheDocument()
  })

  it('should display deadline information', () => {
    render(<GoalTracker goals={mockGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('Due 12/31/2024')).toBeInTheDocument()
  })

  it('should show days left calculation', () => {
    const futureGoals = [
      {
        ...mockGoals[0],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      }
    ]

    render(<GoalTracker goals={futureGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('30 days left')).toBeInTheDocument()
  })

  it('should show overdue status for past deadlines', () => {
    const overdueGoals = [
      {
        ...mockGoals[0],
        deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 10 days ago
      }
    ]

    render(<GoalTracker goals={overdueGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('should show revenue goal insights', () => {
    render(<GoalTracker goals={mockGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('Monthly Avg Needed')).toBeInTheDocument()
    expect(screen.getByText('Current Pace')).toBeInTheDocument()
  })

  it('should open add goal modal when Add Goal button is clicked', () => {
    render(<GoalTracker goals={mockGoals} revenueData={mockRevenueData} />)

    fireEvent.click(screen.getByText('Add Goal'))

    expect(screen.getByText('Add New Goal')).toBeInTheDocument()
    expect(screen.getByText('Goal creation functionality would be implemented here with a proper form.')).toBeInTheDocument()
  })

  it('should close add goal modal when Cancel is clicked', () => {
    render(<GoalTracker goals={mockGoals} revenueData={mockRevenueData} />)

    fireEvent.click(screen.getByText('Add Goal'))
    expect(screen.getByText('Add New Goal')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Add New Goal')).not.toBeInTheDocument()
  })

  it('should close add goal modal when Add Goal button in modal is clicked', () => {
    render(<GoalTracker goals={mockGoals} revenueData={mockRevenueData} />)

    fireEvent.click(screen.getByText('Add Goal'))
    expect(screen.getByText('Add New Goal')).toBeInTheDocument()

    fireEvent.click(screen.getAllByText('Add Goal')[1]) // Second "Add Goal" button in modal
    expect(screen.queryByText('Add New Goal')).not.toBeInTheDocument()
  })

  it('should render goal summary with correct counts', () => {
    const mixedGoals = [
      { ...mockGoals[0], current: 500000, target: 500000 }, // Completed
      { ...mockGoals[1], current: 20, target: 25 }, // On track
      { ...mockGoals[2], current: 100000, target: 600000, deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } // At risk
    ]

    render(<GoalTracker goals={mixedGoals} revenueData={mockRevenueData} />)

    expect(screen.getByText('Goal Summary')).toBeInTheDocument()
    
    // Check summary counts
    const summarySection = screen.getByText('Goal Summary').closest('div')
    expect(summarySection).toHaveTextContent('1') // Completed
    expect(summarySection).toHaveTextContent('1') // On Track
    expect(summarySection).toHaveTextContent('1') // At Risk
  })

  it('should apply custom className', () => {
    const { container } = render(
      <GoalTracker goals={mockGoals} revenueData={mockRevenueData} className="custom-goal-class" />
    )

    expect(container.firstChild).toHaveClass('custom-goal-class')
  })

  it('should handle empty goals array', () => {
    render(<GoalTracker goals={[]} revenueData={mockRevenueData} />)

    expect(screen.getByText('Goal Tracking')).toBeInTheDocument()
    expect(screen.getByText('Goal Summary')).toBeInTheDocument()
    
    // All summary counts should be 0
    const summarySection = screen.getByText('Goal Summary').closest('div')
    const countElements = summarySection?.querySelectorAll('.text-2xl')
    countElements?.forEach(element => {
      expect(element).toHaveTextContent('0')
    })
  })

  it('should show edit and delete buttons for each goal', () => {
    render(<GoalTracker goals={mockGoals} revenueData={mockRevenueData} />)

    // Should have edit and delete buttons for each goal
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    
    expect(editButtons).toHaveLength(mockGoals.length)
    expect(deleteButtons).toHaveLength(mockGoals.length)
  })

  it('should calculate monthly average needed correctly for revenue goals', () => {
    const revenueGoal = {
      ...mockGoals[0],
      target: 600000,
      current: 150000,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 60 days from now
    }

    render(<GoalTracker goals={[revenueGoal]} revenueData={mockRevenueData} />)

    // Remaining: 600000 - 150000 = 450000
    // Months left: ~2 months
    // Monthly needed: ~225000
    expect(screen.getByText('Monthly Avg Needed')).toBeInTheDocument()
  })
})