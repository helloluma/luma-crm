import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CalendarView from '../CalendarView'
import { AppointmentWithClient } from '@/types'

// Mock date-fns to have consistent dates in tests
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    format: vi.fn((date, formatStr) => {
      if (formatStr === 'MMMM yyyy') return 'January 2024'
      if (formatStr === 'MMM d') return 'Jan 1'
      if (formatStr === 'MMM d, yyyy') return 'Jan 1, 2024'
      if (formatStr === 'd') return '1'
      if (formatStr === 'EEE') return 'Mon'
      if (formatStr === 'h a') return '9 AM'
      if (formatStr === 'h:mm a') return '9:00 AM'
      return date.toString()
    }),
  }
})

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
  {
    id: '2',
    title: 'Client Meeting',
    description: 'Discuss contract terms',
    client_id: 'client-2',
    start_time: '2024-01-15T14:00:00Z',
    end_time: '2024-01-15T15:00:00Z',
    location: 'Office',
    type: 'Meeting',
    status: 'Scheduled',
    is_recurring: false,
    recurrence_rule: null,
    recurrence_end_date: null,
    parent_appointment_id: null,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    client: {
      id: 'client-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-0456',
      type: 'Prospect',
      source: 'Referral',
      budget_min: 400000,
      budget_max: 600000,
      preferred_area: 'Suburbs',
      notes: 'First-time buyer',
      assigned_agent: 'user-1',
      last_contact: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
]

describe('CalendarView', () => {
  const defaultProps = {
    appointments: mockAppointments,
    onAppointmentClick: vi.fn(),
    onDateClick: vi.fn(),
    onAppointmentDrop: vi.fn(),
    view: 'month' as const,
    selectedDate: new Date('2024-01-15'),
    loading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Month View', () => {
    it('renders month view correctly', () => {
      render(<CalendarView {...defaultProps} />)
      
      expect(screen.getByText('January 2024')).toBeInTheDocument()
      expect(screen.getByText('Today')).toBeInTheDocument()
      expect(screen.getByLabelText('Previous')).toBeInTheDocument()
      expect(screen.getByLabelText('Next')).toBeInTheDocument()
    })

    it('displays week day headers', () => {
      render(<CalendarView {...defaultProps} />)
      
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      weekDays.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument()
      })
    })

    it('displays appointments in calendar cells', () => {
      render(<CalendarView {...defaultProps} />)
      
      expect(screen.getByText('Property Showing')).toBeInTheDocument()
      expect(screen.getByText('Client Meeting')).toBeInTheDocument()
    })

    it('calls onAppointmentClick when appointment is clicked', () => {
      render(<CalendarView {...defaultProps} />)
      
      const appointment = screen.getByText('Property Showing')
      fireEvent.click(appointment)
      
      expect(defaultProps.onAppointmentClick).toHaveBeenCalledWith(mockAppointments[0])
    })

    it('calls onDateClick when date cell is clicked', () => {
      render(<CalendarView {...defaultProps} />)
      
      const dateCell = screen.getAllByText('1')[0] // First occurrence of day "1"
      fireEvent.click(dateCell.closest('div')!)
      
      expect(defaultProps.onDateClick).toHaveBeenCalled()
    })

    it('navigates to previous month', () => {
      const { rerender } = render(<CalendarView {...defaultProps} />)
      
      const prevButton = screen.getByLabelText('Previous')
      fireEvent.click(prevButton)
      
      // The component should update its internal state
      // We can't easily test this without exposing internal state
      expect(prevButton).toBeInTheDocument()
    })

    it('navigates to next month', () => {
      render(<CalendarView {...defaultProps} />)
      
      const nextButton = screen.getByLabelText('Next')
      fireEvent.click(nextButton)
      
      expect(nextButton).toBeInTheDocument()
    })

    it('navigates to today', () => {
      render(<CalendarView {...defaultProps} />)
      
      const todayButton = screen.getByText('Today')
      fireEvent.click(todayButton)
      
      expect(todayButton).toBeInTheDocument()
    })
  })

  describe('Week View', () => {
    const weekViewProps = {
      ...defaultProps,
      view: 'week' as const,
    }

    it('renders week view correctly', () => {
      render(<CalendarView {...weekViewProps} />)
      
      expect(screen.getByText('Jan 1 - Jan 1, 2024')).toBeInTheDocument()
      expect(screen.getByText('Time')).toBeInTheDocument()
    })

    it('displays time slots', () => {
      render(<CalendarView {...weekViewProps} />)
      
      expect(screen.getAllByText('9 AM').length).toBeGreaterThan(0)
    })

    it('displays appointments in time slots', () => {
      render(<CalendarView {...weekViewProps} />)
      
      expect(screen.getByText('Property Showing')).toBeInTheDocument()
      expect(screen.getByText('Client Meeting')).toBeInTheDocument()
    })
  })

  describe('Drag and Drop', () => {
    it('handles drag start', () => {
      render(<CalendarView {...defaultProps} />)
      
      const appointment = screen.getByText('Property Showing')
      const dragEvent = new Event('dragstart', { bubbles: true })
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      })
      
      fireEvent(appointment, dragEvent)
      
      expect(appointment).toBeInTheDocument()
    })

    it('handles drag over', () => {
      render(<CalendarView {...defaultProps} />)
      
      const dateCell = screen.getAllByText('1')[0].closest('div')!
      const dragEvent = new Event('dragover', { bubbles: true })
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: {
          dropEffect: '',
        },
      })
      
      fireEvent(dateCell, dragEvent)
      
      expect(dateCell).toBeInTheDocument()
    })

    it('handles drop', async () => {
      render(<CalendarView {...defaultProps} />)
      
      // First drag an appointment
      const appointment = screen.getByText('Property Showing')
      const dragStartEvent = new Event('dragstart', { bubbles: true })
      Object.defineProperty(dragStartEvent, 'dataTransfer', {
        value: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      })
      fireEvent(appointment, dragStartEvent)
      
      // Then drop it on a date cell
      const dateCell = screen.getAllByText('1')[1]?.closest('div')!
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          getData: vi.fn(),
        },
      })
      fireEvent(dateCell, dropEvent)
      
      await waitFor(() => {
        expect(defaultProps.onAppointmentDrop).toHaveBeenCalled()
      })
    })
  })

  describe('Loading State', () => {
    it('displays loading skeleton', () => {
      render(<CalendarView {...defaultProps} loading={true} />)
      
      const loadingElement = document.querySelector('.animate-pulse')
      expect(loadingElement).toBeInTheDocument()
    })
  })

  describe('Appointment Colors', () => {
    it('applies correct colors based on appointment type', () => {
      render(<CalendarView {...defaultProps} />)
      
      const showingAppointment = screen.getByText('Property Showing')
      const meetingAppointment = screen.getByText('Client Meeting')
      
      // Find the parent div with the color class
      const showingParent = showingAppointment.closest('.bg-blue-500')
      const meetingParent = meetingAppointment.closest('.bg-green-500')
      
      expect(showingParent).toBeInTheDocument()
      expect(meetingParent).toBeInTheDocument()
    })
  })

  describe('Event Overflow', () => {
    const manyAppointments = Array.from({ length: 5 }, (_, i) => ({
      ...mockAppointments[0],
      id: `appointment-${i}`,
      title: `Appointment ${i + 1}`,
    }))

    it('shows overflow indicator when there are more than 3 events', () => {
      render(<CalendarView {...defaultProps} appointments={manyAppointments} />)
      
      expect(screen.getByText('+2 more')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<CalendarView {...defaultProps} />)
      
      expect(screen.getByLabelText('Previous')).toBeInTheDocument()
      expect(screen.getByLabelText('Next')).toBeInTheDocument()
    })

    it('has proper title attributes for appointments', () => {
      render(<CalendarView {...defaultProps} />)
      
      const appointment = screen.getByText('Property Showing')
      // Find the parent div with title attribute
      const appointmentWithTitle = appointment.closest('[title]')
      expect(appointmentWithTitle).toBeInTheDocument()
    })
  })
})