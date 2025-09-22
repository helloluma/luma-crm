import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ClientForm } from '../ClientForm'
import type { Client, ClientInsert, ClientUpdate } from '@/types'

// Mock the validation functions
vi.mock('@/lib/validations/client', () => ({
  validateClientData: vi.fn(() => []),
  sanitizeClientData: vi.fn((data) => data)
}))

// Mock fetch for agents
global.fetch = vi.fn()

const mockClient: Client = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-123-4567',
  type: 'Lead',
  source: 'Website',
  budget_min: 100000,
  budget_max: 500000,
  preferred_area: 'Downtown',
  notes: 'Interested in condos',
  assigned_agent: '456e7890-e89b-12d3-a456-426614174001',
  last_contact: '2024-01-15T10:00:00Z',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}

const mockAgents = [
  {
    id: '456e7890-e89b-12d3-a456-426614174001',
    name: 'Agent Smith',
    email: 'agent@example.com',
    role: 'Admin' as const,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
]

describe('ClientForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockAgents })
    })
  })

  describe('Create Mode', () => {
    it('renders create form with empty fields', async () => {
      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Add New Client')).toBeInTheDocument()
      expect(screen.getByLabelText(/full name/i)).toHaveValue('')
      expect(screen.getByLabelText(/email address/i)).toHaveValue('')
      expect(screen.getByLabelText(/phone number/i)).toHaveValue('')
      expect(screen.getByDisplayValue('Lead')).toBeInTheDocument()
      expect(screen.getByText('Create Client')).toBeInTheDocument()
    })

    it('loads agents on mount', async () => {
      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/profiles?role=Admin,SuperAdmin')
      })

      await waitFor(() => {
        expect(screen.getByText('Agent Smith (Admin)')).toBeInTheDocument()
      })
    })

    it('validates required fields on submit', async () => {
      const user = userEvent.setup()
      
      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByText('Create Client')
      await user.click(submitButton)

      // Form should not be submitted without required fields
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      
      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Fill in required fields
      await user.type(screen.getByLabelText(/full name/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com')
      await user.type(screen.getByLabelText(/phone number/i), '555-987-6543')

      const submitButton = screen.getByText('Create Client')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '555-987-6543',
            type: 'Lead'
          })
        )
      })
    })

    it('handles budget validation', async () => {
      const user = userEvent.setup()
      
      // Mock validation to return budget error
      const { validateClientData } = await import('@/lib/validations/client')
      vi.mocked(validateClientData).mockReturnValue([
        { field: 'budget', message: 'Minimum budget cannot be greater than maximum budget' }
      ])

      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      await user.type(screen.getByLabelText(/full name/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com')
      await user.type(screen.getByLabelText(/min budget/i), '500000')
      await user.type(screen.getByLabelText(/max budget/i), '100000')

      const submitButton = screen.getByText('Create Client')
      await user.click(submitButton)

      expect(screen.getByText('Minimum budget cannot be greater than maximum budget')).toBeInTheDocument()
      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })

  describe('Edit Mode', () => {
    it('renders edit form with client data', async () => {
      render(
        <ClientForm
          client={mockClient}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(`Edit Client: ${mockClient.name}`)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockClient.name)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockClient.email)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockClient.phone!)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockClient.type)).toBeInTheDocument()
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    it('updates form fields correctly', async () => {
      const user = userEvent.setup()
      
      render(
        <ClientForm
          client={mockClient}
          mode="edit"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const nameField = screen.getByDisplayValue(mockClient.name)
      await user.clear(nameField)
      await user.type(nameField, 'John Updated')

      const typeField = screen.getByDisplayValue(mockClient.type)
      await user.selectOptions(typeField, 'Prospect')

      const submitButton = screen.getByText('Save Changes')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Updated',
            type: 'Prospect'
          })
        )
      })
    })
  })

  describe('Contact Preferences', () => {
    it('renders contact preference fields', () => {
      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Contact Preferences')).toBeInTheDocument()
      expect(screen.getByText('Preferred Contact Methods')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone Call')).toBeInTheDocument()
      expect(screen.getByLabelText('SMS/Text')).toBeInTheDocument()
    })

    it('updates contact preferences', async () => {
      const user = userEvent.setup()
      
      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const smsCheckbox = screen.getByLabelText('SMS/Text')
      await user.click(smsCheckbox)

      expect(smsCheckbox).toBeChecked()

      const preferredMethodSelect = screen.getByLabelText(/primary contact method/i)
      await user.selectOptions(preferredMethodSelect, 'sms')

      expect(preferredMethodSelect).toHaveValue('sms')
    })
  })

  describe('Form Interactions', () => {
    it('shows unsaved changes warning on cancel', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Make a change to mark form as dirty
      await user.type(screen.getByLabelText(/full name/i), 'Test')

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockConfirm).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to cancel?')
      expect(mockOnCancel).not.toHaveBeenCalled()

      mockConfirm.mockRestore()
    })

    it('cancels without warning when no changes made', async () => {
      const user = userEvent.setup()
      
      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('clears validation errors when field is corrected', async () => {
      const user = userEvent.setup()
      
      // Mock validation to return error initially
      const { validateClientData } = await import('@/lib/validations/client')
      vi.mocked(validateClientData).mockReturnValue([
        { field: 'name', message: 'Name is required' }
      ])

      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Try to submit to trigger validation
      const submitButton = screen.getByText('Create Client')
      await user.click(submitButton)

      expect(screen.getByText('Name is required')).toBeInTheDocument()

      // Clear the validation error
      vi.mocked(validateClientData).mockReturnValue([])

      // Type in the name field
      await user.type(screen.getByLabelText(/full name/i), 'John')

      // Error should be cleared
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })

    it('disables submit button when there are validation errors', async () => {
      // Mock validation to return errors
      const { validateClientData } = await import('@/lib/validations/client')
      vi.mocked(validateClientData).mockReturnValue([
        { field: 'name', message: 'Name is required' }
      ])

      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByText('Create Client')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Loading States', () => {
    it('shows loading state during form submission', async () => {
      const user = userEvent.setup()
      
      // Mock a slow onSave function
      const slowOnSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <ClientForm
          mode="create"
          onSave={slowOnSave}
          onCancel={mockOnCancel}
        />
      )

      await user.type(screen.getByLabelText(/full name/i), 'Jane Smith')
      await user.type(screen.getByLabelText(/email address/i), 'jane@example.com')

      const submitButton = screen.getByText('Create Client')
      await user.click(submitButton)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('handles agent loading failure gracefully', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Failed to load'))

      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Should still render the form even if agents fail to load
      expect(screen.getByText('Add New Client')).toBeInTheDocument()
      
      // Agent select should be empty but not broken
      const agentSelect = screen.getByLabelText(/assigned agent/i)
      expect(agentSelect).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Check for proper labels
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/client type/i)).toBeInTheDocument()

      // Check for required field indicators
      expect(screen.getByText(/full name \*/i)).toBeInTheDocument()
      expect(screen.getByText(/email address \*/i)).toBeInTheDocument()
    })

    it('shows validation errors with proper ARIA attributes', async () => {
      const user = userEvent.setup()
      
      // Mock validation to return error
      const { validateClientData } = await import('@/lib/validations/client')
      vi.mocked(validateClientData).mockReturnValue([
        { field: 'email', message: 'Invalid email format' }
      ])

      render(
        <ClientForm
          mode="create"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      await user.type(screen.getByLabelText(/full name/i), 'John')
      await user.type(screen.getByLabelText(/email address/i), 'invalid-email')

      const submitButton = screen.getByText('Create Client')
      await user.click(submitButton)

      const errorMessage = screen.getByText('Invalid email format')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage).toHaveClass('text-red-600')
    })
  })
})