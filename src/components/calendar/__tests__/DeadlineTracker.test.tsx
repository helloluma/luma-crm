import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import DeadlineTracker from '../DeadlineTracker'
import * as useClientStageModule from '@/hooks/useClientStage'

// Mock the useClientStage hook
const mockFetchStageDeadlines = vi.fn()
vi.mock('@/hooks/useClientStage', () => ({
  useClientStage: () => ({
    fetchStageDeadlines: mockFetchStageDeadlines,
    loading: false,
    error: null
  })
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('DeadlineTracker', () => {
  const mockDeadlines = [
    {
      id: 'deadline-1',
      client_id: 'client-1',
      stage: 'Prospect',
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      alert_sent: false,
      alert_sent_at: null,
      created_by: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      client: {
        name: 'John Doe',
        type: 'Prospect'
      }
    },
    {
      id: 'deadline-2',
      client_id: 'client-2',
      stage: 'Client',
      deadline: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 25 hours from now
      alert_sent: true,
      alert_sent_at: '2024-01-01T12:00:00.000Z',
      created_by: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      client: {
        name: 'Jane Smith',
        type: 'Client'
      }
    },
    {
      id: 'deadline-3',
      client_id: 'client-3',
      stage: 'Lead',
      deadline: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (overdue)
      alert_sent: false,
      alert_sent_at: null,
      created_by: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      client: {
        name: 'Bob Johnson',
        type: 'Lead'
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    mockFetchStageDeadlines.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<DeadlineTracker clientId="client-1" />)

    expect(screen.getByText('Deadline Tracker')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  it('renders deadlines for specific client', async () => {
    mockFetchStageDeadlines.mockResolvedValue([mockDeadlines[0]])

    render(<DeadlineTracker clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText('Client Deadlines')).toBeInTheDocument()
      expect(screen.getByText('Prospect Stage')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('HIGH')).toBeInTheDocument() // Priority badge
    })

    expect(mockFetchStageDeadlines).toHaveBeenCalledWith('client-1')
  })

  it('renders all upcoming deadlines', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockDeadlines })
    })

    render(<DeadlineTracker showAllDeadlines={true} />)

    await waitFor(() => {
      expect(screen.getByText('Upcoming Deadlines')).toBeInTheDocument()
      expect(screen.getByText('Prospect Stage')).toBeInTheDocument()
      expect(screen.getByText('Client Stage')).toBeInTheDocument()
      expect(screen.getByText('Lead Stage')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/deadlines/upcoming')
  })

  it('displays correct priority levels and colors', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockDeadlines })
    })

    render(<DeadlineTracker showAllDeadlines={true} />)

    await waitFor(() => {
      // Overdue deadline should show CRITICAL
      expect(screen.getByText('CRITICAL')).toBeInTheDocument()
      // Urgent deadline (2 hours) should show HIGH
      expect(screen.getByText('HIGH')).toBeInTheDocument()
      // Normal deadline (25 hours) should show LOW
      expect(screen.getByText('LOW')).toBeInTheDocument()
    })
  })

  it('shows alert sent indicator', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [mockDeadlines[1]] }) // Deadline with alert sent
    })

    render(<DeadlineTracker showAllDeadlines={true} />)

    await waitFor(() => {
      expect(screen.getByText('Alert sent')).toBeInTheDocument()
    })
  })

  it('handles deadline click callback', async () => {
    const mockOnDeadlineClick = vi.fn()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [mockDeadlines[0]] })
    })

    render(<DeadlineTracker showAllDeadlines={true} onDeadlineClick={mockOnDeadlineClick} />)

    await waitFor(() => {
      expect(screen.getByText(/Stage$/)).toBeInTheDocument()
    })

    const deadlineCard = screen.getByText(/Stage$/).closest('div')
    fireEvent.click(deadlineCard!)

    expect(mockOnDeadlineClick).toHaveBeenCalledWith(expect.objectContaining({
      id: 'deadline-1',
      stage: 'Prospect'
    }))
  })

  it('displays empty state when no deadlines', async () => {
    mockFetchStageDeadlines.mockResolvedValue([])

    render(<DeadlineTracker clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText('No upcoming deadlines')).toBeInTheDocument()
    })
  })

  it('handles error state', async () => {
    mockFetchStageDeadlines.mockRejectedValue(new Error('Failed to fetch'))

    render(<DeadlineTracker clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })

  it('allows retry on error', async () => {
    mockFetchStageDeadlines
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce([mockDeadlines[0]])

    render(<DeadlineTracker clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Retry'))

    await waitFor(() => {
      expect(screen.getByText(/Stage$/)).toBeInTheDocument()
    })

    expect(mockFetchStageDeadlines).toHaveBeenCalledTimes(2)
  })

  it('respects maxItems prop', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockDeadlines })
    })

    render(<DeadlineTracker showAllDeadlines={true} maxItems={2} />)

    await waitFor(() => {
      const deadlineCards = screen.getAllByText(/Stage$/)
      expect(deadlineCards).toHaveLength(2)
      expect(screen.getByText('View all 3 deadlines')).toBeInTheDocument()
    })
  })

  it('shows settings panel when settings button clicked', async () => {
    mockFetchStageDeadlines.mockResolvedValue([])

    render(<DeadlineTracker clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByTitle('Deadline Settings')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTitle('Deadline Settings'))

    expect(screen.getByText('Reminder Settings')).toBeInTheDocument()
    expect(screen.getByText('Email reminders 24 hours before')).toBeInTheDocument()
    expect(screen.getByText('SMS alerts for urgent deadlines')).toBeInTheDocument()
    expect(screen.getByText('In-app notifications')).toBeInTheDocument()
  })

  it('refreshes deadlines when refresh button clicked', async () => {
    mockFetchStageDeadlines.mockResolvedValue([])

    render(<DeadlineTracker clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByTitle('Refresh')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTitle('Refresh'))

    expect(mockFetchStageDeadlines).toHaveBeenCalledTimes(2) // Initial load + refresh
  })

  it('formats deadline times correctly', async () => {
    const now = new Date()
    const todayDeadline = {
      ...mockDeadlines[0],
      deadline: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString() // 12 hours from now (today)
    }

    const tomorrowDeadline = {
      ...mockDeadlines[1],
      deadline: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString() // 25 hours from now (tomorrow)
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [todayDeadline, tomorrowDeadline] })
    })

    render(<DeadlineTracker showAllDeadlines={true} />)

    await waitFor(() => {
      // Check for relative time formatting
      expect(screen.getByText(/Due (today|tomorrow|in \d+ days)/)).toBeInTheDocument()
    })
  })

  it('sorts deadlines by deadline date', async () => {
    const unsortedDeadlines = [
      mockDeadlines[1], // 25 hours from now
      mockDeadlines[2], // 2 hours ago (overdue)
      mockDeadlines[0]  // 2 hours from now
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: unsortedDeadlines })
    })

    render(<DeadlineTracker showAllDeadlines={true} />)

    await waitFor(() => {
      const stageElements = screen.getAllByText(/Stage$/)
      expect(stageElements[0]).toHaveTextContent('Lead Stage') // Overdue (earliest)
      expect(stageElements[1]).toHaveTextContent('Prospect Stage') // 2 hours
      expect(stageElements[2]).toHaveTextContent('Client Stage') // 25 hours
    })
  })
})