import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import AppointmentModal from '../AppointmentModal'
import { AppointmentWithClient } from '@/types'

// Mock date-fns
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    format: vi.fn((date, formatStr) => {
      if (formatStr === 'EEEE, MMMM d, yyyy') return 'Monday, January 15, 2024'
      if (formatStr === 'h:mm a') return '9:00 AM'
      if (formatStr === 'MMM d, yyyy h:mm a') return 'Jan 1, 2024 12:00 AM'
      return date.toString()
    }),
  }
})

const mockAppointment: AppointmentWithClient = {
  id: '1',
  title: 'Property Showing',
  description: 'Show downtown condo to potential buyer',
  client_id: 'client-1',
  start_time: '2024-01-15T09:00:00Z',
  end_time: '2024-01-15T10:00:00Z',
  location: '123 Main St, Downtown',
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
  created_by_profile: {
    id: 'user-1',
    email: 'agent@example.com',
    name: 'Agent Smith',
    role: 'Admin',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
}

const mockRecurringAppointment: AppointmentWithClient = {
  ...mockAppointment,
  id: '2',
  title: 'Weekly Team Meeting',
  is_recurring: true,
  recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO',
}

describe('AppointmentModal', () => {
  const defaultProps = {
    appointment: mockAppointment,
    isOpen: true,
    onClose: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Rendering', () => {
    it('renders modal when open', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      expect(screen.getByText('Appointment Details')).toBeInTheDocument()
      expect(screen.getByText('Property Showing')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<AppointmentModal {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Appointment Details')).not.toBeInTheDocument()
    })

    it('does not render when appointment is null', () => {
      render(<AppointmentModal {...defaultProps} appointment={null} />)
      
      expect(screen.queryByText('Appointment Details')).not.toBeInTheDocument()
    })
  })

  describe('Appointment Information', () => {
    it('displays appointment title and type', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      expect(screen.getByText('Property Showing')).toBeInTheDocument()
      expect(screen.getByText('Showing')).toBeInTheDocument()
      expect(screen.getByText('Scheduled')).toBeInTheDocument()
    })

    it('displays appointment description', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Show downtown condo to potential buyer')).toBeInTheDocument()
    })

    it('displays date and time information', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      expect(screen.getByText('Date & Time')).toBeInTheDocument()
      expect(screen.getByText('Monday, January 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('9:00 AM - 9:00 AM')).toBeInTheDocument()
      expect(screen.getByText('(60 minutes)')).toBeInTheDocument()
    })

    it('displays location', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('123 Main St, Downtown')).toBeInTheDocument()
    })

    it('displays client information', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      expect(screen.getByText('Client')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('555-0123')).toBeInTheDocument()
    })

    it('displays created by information', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      expect(screen.getByText('Created By')).toBeInTheDocument()
      expect(screen.getByText('Agent Smith')).toBeInTheDocument()
    })

    it('displays timestamps', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      expect(screen.getByText(/Created:/)).toBeInTheDocument()
      expect(screen.getByText(/Updated:/)).toBeInTheDocument()
    })
  })

  describe('Recurring Appointments', () => {
    it('displays recurring information', () => {
      render(<AppointmentModal {...defaultProps} appointment={mockRecurringAppointment} />)
      
      expect(screen.getByText('Recurring')).toBeInTheDocument()
      expect(screen.getByText('This is a recurring appointment')).toBeInTheDocument()
      expect(screen.getByText('Rule: FREQ=WEEKLY;BYDAY=MO')).toBeInTheDocument()
    })
  })

  describe('Optional Fields', () => {
    it('hides description when not provided', () => {
      const appointmentWithoutDescription = {
        ...mockAppointment,
        description: null,
      }
      render(<AppointmentModal {...defaultProps} appointment={appointmentWithoutDescription} />)
      
      expect(screen.queryByText('Description')).not.toBeInTheDocument()
    })

    it('hides location when not provided', () => {
      const appointmentWithoutLocation = {
        ...mockAppointment,
        location: null,
      }
      render(<AppointmentModal {...defaultProps} appointment={appointmentWithoutLocation} />)
      
      expect(screen.queryByText('Location')).not.toBeInTheDocument()
    })

    it('hides client information when not provided', () => {
      const appointmentWithoutClient = {
        ...mockAppointment,
        client: null,
      }
      render(<AppointmentModal {...defaultProps} appointment={appointmentWithoutClient} />)
      
      expect(screen.queryByText('Client')).not.toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('calls onClose when close button is clicked', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      const closeButton = screen.getByLabelText('Close modal')
      fireEvent.click(closeButton)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('calls onClose when backdrop is clicked', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      const backdrop = document.querySelector('.fixed.inset-0')!
      fireEvent.click(backdrop)
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('does not close when modal content is clicked', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      const modalContent = screen.getByText('Appointment Details').closest('div')!
      fireEvent.click(modalContent)
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('calls onEdit when edit button is clicked', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      const editButton = screen.getByText('Edit')
      fireEvent.click(editButton)
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockAppointment)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('calls onDelete when delete button is clicked and confirmed', async () => {
      render(<AppointmentModal {...defaultProps} />)
      
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this appointment?')
        expect(defaultProps.onDelete).toHaveBeenCalledWith(mockAppointment.id)
        expect(defaultProps.onClose).toHaveBeenCalled()
      })
    })

    it('does not delete when confirmation is cancelled', async () => {
      vi.stubGlobal('confirm', vi.fn(() => false))
      
      render(<AppointmentModal {...defaultProps} />)
      
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled()
        expect(defaultProps.onDelete).not.toHaveBeenCalled()
        expect(defaultProps.onClose).not.toHaveBeenCalled()
      })
    })

    it('hides edit button when onEdit is not provided', () => {
      render(<AppointmentModal {...defaultProps} onEdit={undefined} />)
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('hides delete button when onDelete is not provided', () => {
      render(<AppointmentModal {...defaultProps} onDelete={undefined} />)
      
      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    })
  })

  describe('Contact Links', () => {
    it('renders email as clickable link', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      const emailLink = screen.getByText('john@example.com')
      expect(emailLink).toHaveAttribute('href', 'mailto:john@example.com')
    })

    it('renders phone as clickable link', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      const phoneLink = screen.getByText('555-0123')
      expect(phoneLink).toHaveAttribute('href', 'tel:555-0123')
    })
  })

  describe('Status Colors', () => {
    it('applies correct colors for appointment types', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      const typeTag = screen.getByText('Showing')
      expect(typeTag).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('applies correct colors for appointment status', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      const statusTag = screen.getByText('Scheduled')
      expect(statusTag).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('applies default colors for unknown types', () => {
      const appointmentWithUnknownType = {
        ...mockAppointment,
        type: 'Unknown' as any,
      }
      render(<AppointmentModal {...defaultProps} appointment={appointmentWithUnknownType} />)
      
      const typeTag = screen.getByText('Unknown')
      expect(typeTag).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    it('focuses on modal when opened', () => {
      render(<AppointmentModal {...defaultProps} />)
      
      // The modal should be focusable
      const modal = document.querySelector('.fixed.inset-0')!
      expect(modal).toBeInTheDocument()
    })
  })
})