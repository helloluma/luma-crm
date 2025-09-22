import { render, screen } from '@testing-library/react'
import { ClientStagePipeline } from '../ClientStagePipeline'
import type { Client } from '@/types'
import { vi } from 'vitest'

const mockClient: Client = {
  id: 'client-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  type: 'Lead',
  source: 'Website',
  budget_min: 100000,
  budget_max: 200000,
  preferred_area: 'Downtown',
  notes: 'Interested in condos',
  assigned_agent: 'agent-1',
  last_contact: '2024-01-01T00:00:00.000Z',
  stage_changed_at: '2024-01-01T00:00:00.000Z',
  stage_deadline: null,
  stage_notes: null,
  previous_stage: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

describe('ClientStagePipeline', () => {
  const mockOnStageChange = vi.fn()
  const mockOnSetDeadline = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render pipeline stages correctly', () => {
    render(
      <ClientStagePipeline
        client={mockClient}
        onStageChange={mockOnStageChange}
        onSetDeadline={mockOnSetDeadline}
      />
    )

    expect(screen.getByText('Lead')).toBeInTheDocument()
    expect(screen.getByText('Prospect')).toBeInTheDocument()
    expect(screen.getByText('Client')).toBeInTheDocument()
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it('should highlight current stage', () => {
    render(
      <ClientStagePipeline
        client={mockClient}
        onStageChange={mockOnStageChange}
        onSetDeadline={mockOnSetDeadline}
      />
    )

    const leadStage = screen.getByText('Lead').closest('div')
    expect(leadStage).toHaveClass('text-yellow-800')
  })

  it('should show deadline information when present', () => {
    const clientWithDeadline = {
      ...mockClient,
      stage_deadline: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString() // Just over 24 hours
    }

    render(
      <ClientStagePipeline
        client={clientWithDeadline}
        onStageChange={mockOnStageChange}
        onSetDeadline={mockOnSetDeadline}
      />
    )

    // The component shows "Due tomorrow" for dates within 48 hours
    expect(screen.getByText('Due tomorrow')).toBeInTheDocument()
  })

  it('should show overdue deadline', () => {
    const clientWithOverdueDeadline = {
      ...mockClient,
      stage_deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
    }

    render(
      <ClientStagePipeline
        client={clientWithOverdueDeadline}
        onStageChange={mockOnStageChange}
        onSetDeadline={mockOnSetDeadline}
      />
    )

    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('should not be interactive when interactive prop is false', () => {
    render(
      <ClientStagePipeline
        client={mockClient}
        onStageChange={mockOnStageChange}
        onSetDeadline={mockOnSetDeadline}
        interactive={false}
      />
    )

    // When not interactive, stages should not have cursor-pointer class
    // We can check that no elements have the cursor-pointer class
    const cursorPointerElements = document.querySelectorAll('.cursor-pointer')
    expect(cursorPointerElements).toHaveLength(0)
  })

  it('should show stage descriptions', () => {
    render(
      <ClientStagePipeline
        client={mockClient}
        onStageChange={mockOnStageChange}
        onSetDeadline={mockOnSetDeadline}
      />
    )

    expect(screen.getByText('Initial contact or inquiry')).toBeInTheDocument()
    expect(screen.getByText('Qualified and interested')).toBeInTheDocument()
    expect(screen.getByText('Active client with agreement')).toBeInTheDocument()
    expect(screen.getByText('Deal completed or lost')).toBeInTheDocument()
  })

  it('should show correct stage status icons', () => {
    render(
      <ClientStagePipeline
        client={mockClient}
        onStageChange={mockOnStageChange}
        onSetDeadline={mockOnSetDeadline}
      />
    )

    // Current stage should have clock icon
    const clockIcon = document.querySelector('.lucide-clock')
    expect(clockIcon).toBeInTheDocument()
  })

  it('should show completed stage with check icon', () => {
    const completedClient = {
      ...mockClient,
      type: 'Prospect' as const // Now Lead should show as completed
    }

    render(
      <ClientStagePipeline
        client={completedClient}
        onStageChange={mockOnStageChange}
        onSetDeadline={mockOnSetDeadline}
      />
    )

    // Should have check icon for completed stage
    const checkIcon = document.querySelector('.lucide-check')
    expect(checkIcon).toBeInTheDocument()
  })
})