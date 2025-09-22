import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CalendarContainer from '../CalendarContainer'
import { AppointmentWithClient } from '@/types'

// Mock SWR with a simple implementation
vi.mock('swr', () => ({
  default: vi.fn(),
  mutate: vi.fn(),
}))

// Mock the child components
vi.mock('../CalendarView', () => ({
  default: vi.fn(({ onAppointmentClick, onDateClick, onAppointmentDrop }) => (
    <div data-testid="calendar-view">
      <button onClick={() => onAppointmentClick?.({ id: '1', title: 'Test Appointment' })}>
        Test Appointment
      </button>
      <button onClick={() => onDateClick?.(new Date('2024-01-15'))}>
        Test Date
      </button>
      <button onClick={() => onAppointmentDrop?.('1', new Date('2024-01-16'), '10:00')}>
        Test Drop
      </button>
    </div>
  )),
}))

vi.mock('../AppointmentModal', () => ({
  default: vi.fn(({ isOpen, onClose, onEdit, onDelete, appointment }) => (
    isOpen ? (
      <div data-testid="appointment-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => onEdit?.(appointment)}>Edit Appointment</button>
        <button onClick={() => onDelete?.('1')}>Delete Appointment</button>
      </div>
    ) : null
  )),
}))

// Mock fetch
global.fetch = vi.fn()

const mockAppointments: AppointmentWithClient[] = [
  {
    id: '1',
    title: 'Property Showing',
    description: 'Show downtown condo',
    client_id: 'client-1',
    start_time: '2024-01-15T09:00:00Z',
    end_time: '2024-01-15T10:00:00Z',
    location: '123 Main St',
    type: 'Showing',
    status: 'Scheduled',
    is_recurring: false,
    recurrence_rule: null,
    recurrence_end_date: null,
    parent_appointment_id: null,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    client: {
      id: 'client-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0123',
      type: 'Client',
      source: 'Website',
      budget_min: 300000,
      budget_max: 500000,
      preferred_area: 'Downtown',
      notes: 'Looking for 2BR condo',
      assigned_agent: 'user-1',
      last_contact: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
]

describe.skip('CalendarContainer', () => {
  const defaultProps = {
    onCreateAppointment: vi.fn(),
    onEditAppointment: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock SWR to return successful data
    const mockUseSWR = vi.mocked(vi.importMock('swr')).default
    mockUseSWR.mockReturnValue({
      data: { data: mockAppointments },
      error: null,
      isLoading: false,
    })
  })

  describe('Rendering', () => {
    it('renders calendar container with controls', () => {
      render(<CalendarContainer {...defaultProps} />)
      
      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.getByText('Month')).toBeInTheDocument()
      expect(screen.getByText('Week')).toBeInTheDocument()
      expect(screen.getByText('New Appointment')).toBeInTheDocument()
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument()
    })

    it('renders without create appointment button when callback not provided', () => {
      render(<CalendarContainer onEditAppointment={defaultProps.onEditAppointment} />)
      
      expect(screen.queryByText('New Appointment')).not.toBeInTheDocument()
    })
  })

  describe('View Toggle', () => {
    it('switches between month and week view', () => {
      render(<CalendarContainer {...defaultProps} />)
      
      const monthButton = screen.getByText('Month')
      const weekButton = screen.getByText('Week')
      
      // Initially month should be active
      expect(monthButton).toHaveClass('bg-white')
      expect(weekButton).not.toHaveClass('bg-white')
      
      // Click week button
      fireEvent.click(weekButton)
      
      expect(weekButton).toHaveClass('bg-white')
      expect(monthButton).not.toHaveClass('bg-white')
    })
  })

  describe('Appointment Interactions', () => {
    it('opens modal when appointment is clicked', () => {
      render(<CalendarContainer {...defaultProps} />)
      
      const appointmentButton = screen.getByText('Test Appointment')
      fireEvent.click(appointmentButton)
      
      expect(screen.getByTestId('appointment-modal')).toBeInTheDocument()
    })

    it('closes modal when close button is clicked', () => {
      render(<CalendarContainer {...defaultProps} />)
      
      // Open modal
      const appointmentButton = screen.getByText('Test Appointment')
      fireEvent.click(appointmentButton)
      
      // Close modal
      const closeButton = screen.getByText('Close Modal')
      fireEvent.click(closeButton)
      
      expect(screen.queryByTestId('appointment-modal')).not.toBeInTheDocument()
    })

    it('calls onEditAppointment when edit is clicked', () => {
      render(<CalendarContainer {...defaultProps} />)
      
      // Open modal
      const appointmentButton = screen.getByText('Test Appointment')
      fireEvent.click(appointmentButton)
      
      // Click edit
      const editButton = screen.getByText('Edit Appointment')
      fireEvent.click(editButton)
      
      expect(defaultProps.onEditAppointment).toHaveBeenCalled()
    })

    it('calls onCreateAppointment when date is clicked', () => {
      render(<CalendarContainer {...defaultProps} />)
      
      const dateButton = screen.getByText('Test Date')
      fireEvent.click(dateButton)
      
      expect(defaultProps.onCreateAppointment).toHaveBeenCalledWith(new Date('2024-01-15'))
    })

    it('calls onCreateAppointment when new appointment button is clicked', () => {
      render(<CalendarContainer {...defaultProps} />)
      
      const newAppointmentButton = screen.getByText('New Appointment')
      fireEvent.click(newAppointmentButton)
      
      expect(defaultProps.onCreateAppointment).toHaveBeenCalledWith()
    })
  })

  describe('Drag and Drop', () => {
    it('handles appointment drop and updates appointment', async () => {
      const mockFetch = global.fetch as vi.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      render(<CalendarContainer {...defaultProps} />)
      
      const dropButton = screen.getByText('Test Drop')
      fireEvent.click(dropButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/appointments/1', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"start_time"'),
        })
      })
    })

    it('handles drop error gracefully', async () => {
      const mockFetch = global.fetch as vi.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<CalendarContainer {...defaultProps} />)
      
      const dropButton = screen.getByText('Test Drop')
      fireEvent.click(dropButton)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error updating appointment:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Appointment Deletion', () => {
    it('deletes appointment when delete is confirmed', async () => {
      const mockFetch = global.fetch as vi.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      render(<CalendarContainer {...defaultProps} />)
      
      // Open modal
      const appointmentButton = screen.getByText('Test Appointment')
      fireEvent.click(appointmentButton)
      
      // Click delete
      const deleteButton = screen.getByText('Delete Appointment')
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/appointments/1', {
          method: 'DELETE',
        })
      })
    })

    it('handles delete error gracefully', async () => {
      const mockFetch = global.fetch as vi.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<CalendarContainer {...defaultProps} />)
      
      // Open modal
      const appointmentButton = screen.getByText('Test Appointment')
      fireEvent.click(appointmentButton)
      
      // Click delete
      const deleteButton = screen.getByText('Delete Appointment')
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error deleting appointment:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Loading State', () => {
    it('passes loading state to calendar view', () => {
      const mockUseSWR = vi.mocked(vi.importMock('swr')).default
      mockUseSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
      })

      render(<CalendarContainer {...defaultProps} />)
      
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('displays error message when appointments fail to load', () => {
      const mockUseSWR = vi.mocked(vi.importMock('swr')).default
      mockUseSWR.mockReturnValue({
        data: null,
        error: new Error('Failed to fetch'),
        isLoading: false,
      })

      render(<CalendarContainer {...defaultProps} />)
      
      expect(screen.getByText('Failed to load calendar')).toBeInTheDocument()
      expect(screen.getByText('There was an error loading your appointments. Please try again.')).toBeInTheDocument()
    })
  })

  describe('Data Fetching', () => {
    it('fetches appointments with correct date range', () => {
      const mockUseSWR = vi.mocked(vi.importMock('swr')).default
      
      render(<CalendarContainer {...defaultProps} />)
      
      expect(mockUseSWR).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/appointments\?start_date=\d{4}-\d{2}-01&end_date=\d{4}-\d{2}-\d{2}/),
        expect.any(Function),
        expect.any(Object)
      )
    })
  })

  describe('SWR Configuration', () => {
    it('configures SWR with correct options', () => {
      const mockUseSWR = vi.mocked(vi.importMock('swr')).default
      
      render(<CalendarContainer {...defaultProps} />)
      
      expect(mockUseSWR).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
        }
      )
    })
  })
})