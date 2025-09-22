import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PublicCalendarView from '../PublicCalendarView'

// Mock fetch
import { vi } from 'vitest'

global.fetch = vi.fn()

const mockFetch = vi.mocked(fetch)

describe('PublicCalendarView', () => {
  const mockAppointments = [
    {
      id: 'appointment-1',
      title: 'Property Showing',
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T11:00:00Z',
      type: 'Showing',
      status: 'Scheduled'
    },
    {
      id: 'appointment-2',
      title: 'Client Meeting',
      start_time: '2024-01-15T14:00:00Z',
      end_time: '2024-01-15T15:00:00Z',
      type: 'Meeting',
      status: 'Scheduled'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    )

    render(<PublicCalendarView calendarId="test-calendar-id" />)
    
    // Check for loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should display appointments when loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointments: mockAppointments })
    } as Response)

    render(<PublicCalendarView calendarId="test-calendar-id" />)

    await waitFor(() => {
      expect(screen.getByText('Property Showing')).toBeInTheDocument()
      expect(screen.getByText('Client Meeting')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/calendar/public/test-calendar-id')
  })

  it('should handle calendar not found error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Calendar not found' })
    } as Response)

    render(<PublicCalendarView calendarId="invalid-calendar-id" />)

    await waitFor(() => {
      expect(screen.getByText('Calendar Unavailable')).toBeInTheDocument()
      expect(screen.getByText('Calendar not found or no longer available')).toBeInTheDocument()
    })
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<PublicCalendarView calendarId="test-calendar-id" />)

    await waitFor(() => {
      expect(screen.getByText('Calendar Unavailable')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('should navigate between months', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointments: mockAppointments })
    } as Response)

    render(<PublicCalendarView calendarId="test-calendar-id" />)

    await waitFor(() => {
      expect(screen.getByText('Property Showing')).toBeInTheDocument()
    })

    // Get current month display
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    expect(screen.getByText(currentMonth)).toBeInTheDocument()

    // Navigate to next month
    const nextButton = screen.getByLabelText('Next month')
    fireEvent.click(nextButton)

    // Navigate to previous month
    const prevButton = screen.getByLabelText('Previous month')
    fireEvent.click(prevButton)

    // Navigate to today
    const todayButton = screen.getByText('Today')
    fireEvent.click(todayButton)
  })

  it('should display appointment type colors correctly', async () => {
    const appointmentsWithDifferentTypes = [
      { ...mockAppointments[0], type: 'Showing' },
      { ...mockAppointments[1], type: 'Meeting' },
      {
        id: 'appointment-3',
        title: 'Phone Call',
        start_time: '2024-01-15T16:00:00Z',
        end_time: '2024-01-15T16:30:00Z',
        type: 'Call',
        status: 'Scheduled'
      },
      {
        id: 'appointment-4',
        title: 'Contract Deadline',
        start_time: '2024-01-15T17:00:00Z',
        end_time: '2024-01-15T17:00:00Z',
        type: 'Deadline',
        status: 'Scheduled'
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointments: appointmentsWithDifferentTypes })
    } as Response)

    render(<PublicCalendarView calendarId="test-calendar-id" />)

    await waitFor(() => {
      expect(screen.getByText('Property Showing')).toBeInTheDocument()
      expect(screen.getByText('Client Meeting')).toBeInTheDocument()
      expect(screen.getByText('Phone Call')).toBeInTheDocument()
      expect(screen.getByText('Contract Deadline')).toBeInTheDocument()
    })

    // Check legend is displayed
    expect(screen.getByText('Showing')).toBeInTheDocument()
    expect(screen.getByText('Meeting')).toBeInTheDocument()
    expect(screen.getByText('Call')).toBeInTheDocument()
    expect(screen.getByText('Deadline')).toBeInTheDocument()
  })

  it('should display privacy notice', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointments: [] })
    } as Response)

    render(<PublicCalendarView calendarId="test-calendar-id" />)

    await waitFor(() => {
      expect(screen.getByText('This calendar shows availability only. Contact directly to schedule appointments.')).toBeInTheDocument()
    })
  })

  it('should handle appointments with truncated display', async () => {
    // Create many appointments for the same day to test truncation
    const manyAppointments = Array.from({ length: 5 }, (_, i) => ({
      id: `appointment-${i}`,
      title: `Appointment ${i + 1}`,
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T11:00:00Z',
      type: 'Meeting',
      status: 'Scheduled'
    }))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ appointments: manyAppointments })
    } as Response)

    render(<PublicCalendarView calendarId="test-calendar-id" />)

    await waitFor(() => {
      expect(screen.getByText('Appointment 1')).toBeInTheDocument()
      expect(screen.getByText('Appointment 2')).toBeInTheDocument()
      expect(screen.getByText('+3 more')).toBeInTheDocument()
    })
  })
})