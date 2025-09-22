import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import DeadlineManager from '../DeadlineManager'
import * as useClientStageModule from '@/hooks/useClientStage'

// Mock the useClientStage hook
const mockFetchStageDeadlines = vi.fn()
const mockSetStageDeadline = vi.fn()
vi.mock('@/hooks/useClientStage', () => ({
  useClientStage: () => ({
    fetchStageDeadlines: mockFetchStageDeadlines,
    setStageDeadline: mockSetStageDeadline,
    loading: false,
    error: null
  })
}))

// Mock fetch for delete operations
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('DeadlineManager', () => {
  const mockProps = {
    clientId: 'client-1',
    clientName: 'John Doe',
    currentStage: 'Prospect' as const,
    onDeadlineUpdated: vi.fn()
  }

  const mockDeadlines = [
    {
      id: 'deadline-1',
      client_id: 'client-1',
      stage: 'Prospect',
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      alert_sent: false,
      alert_sent_at: null,
      created_by: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'deadline-2',
      client_id: 'client-1',
      stage: 'Client',
      deadline: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      alert_sent: true,
      alert_sent_at: '2024-01-01T12:00:00.000Z',
      created_by: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchStageDeadlines.mockResolvedValue(mockDeadlines)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders deadline manager with client name', async () => {
    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Deadline Management')).toBeInTheDocument()
      expect(screen.getByText('Manage deadlines for John Doe')).toBeInTheDocument()
      expect(screen.getByText('Add Deadline')).toBeInTheDocument()
    })
  })

  it('displays existing deadlines', async () => {
    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Prospect Stage Deadline')).toBeInTheDocument()
      expect(screen.getByText('Client Stage Deadline')).toBeInTheDocument()
      expect(screen.getByText('URGENT')).toBeInTheDocument() // 2 hours deadline
      expect(screen.getByText('LOW')).toBeInTheDocument() // 25 hours deadline
    })
  })

  it('shows empty state when no deadlines', async () => {
    mockFetchStageDeadlines.mockResolvedValue([])

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('No deadlines set for this client')).toBeInTheDocument()
      expect(screen.getByText('Add deadlines to track important milestones')).toBeInTheDocument()
    })
  })

  it('opens form when Add Deadline button clicked', async () => {
    mockFetchStageDeadlines.mockResolvedValue([])

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Add Deadline')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Add Deadline'))

    expect(screen.getByText('Add New Deadline')).toBeInTheDocument()
    expect(screen.getByLabelText('Stage')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Time')).toBeInTheDocument()
  })

  it('pre-fills form with current stage and default date', async () => {
    mockFetchStageDeadlines.mockResolvedValue([])

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Deadline'))
    })

    const stageSelect = screen.getByLabelText('Stage') as HTMLSelectElement
    expect(stageSelect.value).toBe('Prospect')

    const dateInput = screen.getByLabelText('Date') as HTMLInputElement
    expect(dateInput.value).toBeTruthy() // Should have a default date

    const timeInput = screen.getByLabelText('Time') as HTMLInputElement
    expect(timeInput.value).toBe('09:00')
  })

  it('submits new deadline successfully', async () => {
    mockFetchStageDeadlines
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockDeadlines[0]]) // After creation

    mockSetStageDeadline.mockResolvedValue(mockDeadlines[0])

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Deadline'))
    })

    // Fill form
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowString = tomorrow.toISOString().split('T')[0]

    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: tomorrowString }
    })

    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '14:30' }
    })

    // Submit form
    fireEvent.click(screen.getByText('Save Deadline'))

    await waitFor(() => {
      expect(mockSetStageDeadline).toHaveBeenCalledWith(
        'client-1',
        'Prospect',
        expect.any(Date)
      )
      expect(mockProps.onDeadlineUpdated).toHaveBeenCalled()
    })
  })

  it('handles form validation errors', async () => {
    mockFetchStageDeadlines.mockResolvedValue([])

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Deadline'))
    })

    // Clear required fields
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } })

    // Try to submit
    fireEvent.click(screen.getByText('Save Deadline'))

    // Form should not submit due to HTML5 validation
    expect(mockSetStageDeadline).not.toHaveBeenCalled()
  })

  it('opens edit form when edit button clicked', async () => {
    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      expect(screen.getAllByTitle('Edit deadline')).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByTitle('Edit deadline')[0])

    expect(screen.getByText('Edit Deadline')).toBeInTheDocument()
    expect(screen.getByText('Update Deadline')).toBeInTheDocument()

    // Form should be pre-filled with existing deadline data
    const stageSelect = screen.getByLabelText('Stage') as HTMLSelectElement
    expect(stageSelect.value).toBe('Prospect')
  })

  it('deletes deadline with confirmation', async () => {
    // Mock window.confirm
    const mockConfirm = vi.fn().mockReturnValue(true)
    Object.defineProperty(window, 'confirm', { value: mockConfirm })

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Deadline deleted successfully' })
    })

    mockFetchStageDeadlines
      .mockResolvedValueOnce(mockDeadlines)
      .mockResolvedValueOnce([mockDeadlines[1]]) // After deletion

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      expect(screen.getAllByTitle('Delete deadline')).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByTitle('Delete deadline')[0])

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this deadline?')
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/deadlines/deadline-1', {
        method: 'DELETE'
      })
      expect(mockProps.onDeadlineUpdated).toHaveBeenCalled()
    })
  })

  it('cancels deletion when user declines confirmation', async () => {
    const mockConfirm = vi.fn().mockReturnValue(false)
    Object.defineProperty(window, 'confirm', { value: mockConfirm })

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      expect(screen.getAllByTitle('Delete deadline')).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByTitle('Delete deadline')[0])

    expect(mockConfirm).toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('handles delete error', async () => {
    const mockConfirm = vi.fn().mockReturnValue(true)
    Object.defineProperty(window, 'confirm', { value: mockConfirm })

    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to delete deadline' })
    })

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      fireEvent.click(screen.getAllByTitle('Delete deadline')[0])
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to delete deadline')).toBeInTheDocument()
    })
  })

  it('cancels form when cancel button clicked', async () => {
    mockFetchStageDeadlines.mockResolvedValue([])

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Deadline'))
    })

    expect(screen.getByText('Add New Deadline')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))

    expect(screen.queryByText('Add New Deadline')).not.toBeInTheDocument()
  })

  it('displays error messages', async () => {
    mockSetStageDeadline.mockRejectedValue(new Error('Failed to save deadline'))

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Deadline'))
    })

    // Fill and submit form
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowString = tomorrow.toISOString().split('T')[0]

    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: tomorrowString }
    })

    fireEvent.click(screen.getByText('Save Deadline'))

    await waitFor(() => {
      expect(screen.getByText('Failed to save deadline')).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    render(<DeadlineManager {...mockProps} />)

    // Should show loading skeleton initially
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading animation
  })

  it('sets default deadline days based on stage selection', async () => {
    mockFetchStageDeadlines.mockResolvedValue([])

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Deadline'))
    })

    // Change stage to Lead
    fireEvent.change(screen.getByLabelText('Stage'), {
      target: { value: 'Lead' }
    })

    // Date should be updated to 7 days from now (Lead default)
    const dateInput = screen.getByLabelText('Date') as HTMLInputElement
    const expectedDate = new Date()
    expectedDate.setDate(expectedDate.getDate() + 7)
    const expectedDateString = expectedDate.toISOString().split('T')[0]

    expect(dateInput.value).toBe(expectedDateString)
  })

  it('displays correct status badges for different deadline urgencies', async () => {
    const overdueDeadline = {
      ...mockDeadlines[0],
      deadline: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    }

    mockFetchStageDeadlines.mockResolvedValue([overdueDeadline])

    render(<DeadlineManager {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('OVERDUE')).toBeInTheDocument()
    })
  })
})