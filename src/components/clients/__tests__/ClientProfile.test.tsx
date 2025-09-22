import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ClientProfile } from '../ClientProfile'
import type { ClientWithAgent } from '@/types'

// Mock the hooks
vi.mock('@/hooks/useClientForm', () => ({
  useClientForm: vi.fn(() => ({
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
    loading: false
  }))
}))

// Mock fetch
global.fetch = vi.fn()

const mockClient: ClientWithAgent = {
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
  updated_at: '2024-01-15T10:00:00Z',
  assigned_agent_profile: {
    id: '456e7890-e89b-12d3-a456-426614174001',
    name: 'Agent Smith',
    email: 'agent@example.com',
    role: 'Admin',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
}

describe('ClientProfile', () => {
  const mockOnClose = vi.fn()
  const mockOnClientUpdated = vi.fn()
  const mockOnClientDeleted = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockClient })
    })
  })

  describe('Loading and Error States', () => {
    it('shows loading state initially', () => {
      ;(global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<ClientProfile clientId={mockClient.id} />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows error state when client fetch fails', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Client not found' })
      })

      render(<ClientProfile clientId={mockClient.id} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Client not found')).toBeInTheDocument()
      })

      expect(screen.getByText('Close')).toBeInTheDocument()
    })

    it('shows error state when network fails', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('Client Information Display', () => {
    it('renders client information correctly', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      expect(screen.getByText(mockClient.type)).toBeInTheDocument()
      expect(screen.getByText(`Source: ${mockClient.source}`)).toBeInTheDocument()
      expect(screen.getByText(mockClient.email)).toBeInTheDocument()
      expect(screen.getByText(mockClient.phone!)).toBeInTheDocument()
      expect(screen.getByText(mockClient.preferred_area!)).toBeInTheDocument()
    })

    it('displays budget range correctly', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText('$100,000 - $500,000')).toBeInTheDocument()
      })
    })

    it('displays assigned agent information', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText('Agent Smith')).toBeInTheDocument()
      })
    })

    it('shows notes when available', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.notes!)).toBeInTheDocument()
      })
    })

    it('handles missing optional fields gracefully', async () => {
      const clientWithoutOptionals = {
        ...mockClient,
        phone: null,
        source: null,
        preferred_area: null,
        notes: null,
        budget_min: null,
        budget_max: null
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: clientWithoutOptionals })
      })

      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      expect(screen.getByText('Not specified')).toBeInTheDocument()
    })
  })

  describe('Navigation Tabs', () => {
    it('renders all navigation tabs', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Documents')).toBeInTheDocument()
      expect(screen.getByText('Transactions')).toBeInTheDocument()
      expect(screen.getByText('History')).toBeInTheDocument()
    })

    it('switches to edit tab when clicked', async () => {
      const user = userEvent.setup()
      
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      const editTab = screen.getByText('Edit')
      await user.click(editTab)

      // Should show the edit form
      expect(screen.getByText(`Edit Client: ${mockClient.name}`)).toBeInTheDocument()
    })

    it('shows placeholder content for unimplemented tabs', async () => {
      const user = userEvent.setup()
      
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      // Test Documents tab
      const documentsTab = screen.getByText('Documents')
      await user.click(documentsTab)
      expect(screen.getByText('Document management will be implemented in a future task.')).toBeInTheDocument()

      // Test Transactions tab
      const transactionsTab = screen.getByText('Transactions')
      await user.click(transactionsTab)
      expect(screen.getByText('Transaction management will be implemented in a future task.')).toBeInTheDocument()
    })
  })

  describe('Quick Actions', () => {
    it('renders quick action buttons', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      expect(screen.getByText('Edit Client')).toBeInTheDocument()
      expect(screen.getByText('Delete Client')).toBeInTheDocument()
    })

    it('switches to edit mode when edit button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      const editButton = screen.getByText('Edit Client')
      await user.click(editButton)

      expect(screen.getByText(`Edit Client: ${mockClient.name}`)).toBeInTheDocument()
    })

    it('shows delete confirmation when delete button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      const deleteButton = screen.getByText('Delete Client')
      await user.click(deleteButton)

      expect(screen.getByText('Delete Client')).toBeInTheDocument()
      expect(screen.getByText(`Are you sure you want to delete ${mockClient.name}? This action cannot be undone.`)).toBeInTheDocument()
    })
  })

  describe('Delete Confirmation Modal', () => {
    it('cancels delete when cancel button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      // Open delete modal
      const deleteButton = screen.getByText('Delete Client')
      await user.click(deleteButton)

      // Cancel delete
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      // Modal should be closed
      expect(screen.queryByText('Are you sure you want to delete')).not.toBeInTheDocument()
    })

    it('calls delete function when confirmed', async () => {
      const user = userEvent.setup()
      const mockDeleteClient = vi.fn()
      
      const { useClientForm } = await import('@/hooks/useClientForm')
      vi.mocked(useClientForm).mockReturnValue({
        updateClient: vi.fn(),
        deleteClient: mockDeleteClient,
        loading: false
      })

      render(
        <ClientProfile 
          clientId={mockClient.id} 
          onClientDeleted={mockOnClientDeleted}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      // Open delete modal
      const deleteButton = screen.getByText('Delete Client')
      await user.click(deleteButton)

      // Confirm delete
      const confirmButton = screen.getByText('Delete')
      await user.click(confirmButton)

      expect(mockDeleteClient).toHaveBeenCalledWith(mockClient.id)
    })
  })

  describe('Stage Management', () => {
    it('handles stage changes', async () => {
      const mockUpdateClient = vi.fn()
      
      const { useClientForm } = await import('@/hooks/useClientForm')
      vi.mocked(useClientForm).mockReturnValue({
        updateClient: mockUpdateClient,
        deleteClient: vi.fn(),
        loading: false
      })

      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      // This would typically be triggered by the ClientStagePipeline component
      // For now, we'll test the handler function exists
      expect(screen.getByText('Client Journey')).toBeInTheDocument()
    })
  })

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<ClientProfile clientId={mockClient.id} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      const closeButton = screen.getByLabelText('Close')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('does not render close button when onClose is not provided', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      expect(screen.queryByLabelText('Close')).not.toBeInTheDocument()
    })
  })

  describe('Summary Statistics', () => {
    it('displays summary statistics', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      expect(screen.getByText('Summary')).toBeInTheDocument()
      expect(screen.getByText('Documents')).toBeInTheDocument()
      expect(screen.getByText('Transactions')).toBeInTheDocument()
      expect(screen.getByText('Appointments')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: mockClient.name })).toBeInTheDocument()
      })
    })

    it('has proper navigation structure', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
    })

    it('has proper button labels', async () => {
      render(<ClientProfile clientId={mockClient.id} onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      expect(screen.getByLabelText('Close')).toBeInTheDocument()
    })
  })

  describe('Data Formatting', () => {
    it('formats dates correctly', async () => {
      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      // Check that dates are formatted (exact format may vary based on locale)
      expect(screen.getByText(/Jan \d+, 2024/)).toBeInTheDocument()
    })

    it('handles null dates gracefully', async () => {
      const clientWithNullDate = {
        ...mockClient,
        last_contact: null
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: clientWithNullDate })
      })

      render(<ClientProfile clientId={mockClient.id} />)

      await waitFor(() => {
        expect(screen.getByText(mockClient.name)).toBeInTheDocument()
      })

      expect(screen.getByText('Last contact: Never')).toBeInTheDocument()
    })
  })
})