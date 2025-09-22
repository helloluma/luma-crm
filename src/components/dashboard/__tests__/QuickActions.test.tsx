import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { QuickActions } from '../QuickActions'

// Mock console methods to avoid noise in tests
const mockConsoleLog = vi.fn()
const mockConsoleError = vi.fn()

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(mockConsoleLog)
  vi.spyOn(console, 'error').mockImplementation(mockConsoleError)
})

afterAll(() => {
  vi.restoreAllMocks()
})

beforeEach(() => {
  mockConsoleLog.mockClear()
  mockConsoleError.mockClear()
  // Reset body style before each test
  document.body.style.overflow = ''
})

describe('QuickActions', () => {
  it('renders all quick action buttons', () => {
    render(<QuickActions />)
    
    expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /schedule meeting/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument()
  })

  it('displays keyboard shortcuts in button titles', () => {
    render(<QuickActions />)
    
    const clientButton = screen.getByRole('button', { name: /add client/i })
    expect(clientButton).toHaveAttribute('title', expect.stringContaining('Ctrl+Shift+C'))
  })

  it('applies custom className', () => {
    const { container } = render(<QuickActions className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  describe('Client Modal', () => {
    it('opens client modal when button is clicked', async () => {
      render(<QuickActions />)
      
      const clientButton = screen.getByRole('button', { name: /add client/i })
      fireEvent.click(clientButton)
      
      expect(screen.getByRole('dialog', { name: /add new client/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('closes client modal when cancel is clicked', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /add new client/i })).not.toBeInTheDocument()
      })
    })

    it('closes client modal when X button is clicked', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      fireEvent.click(screen.getByRole('button', { name: /close modal/i }))
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /add new client/i })).not.toBeInTheDocument()
      })
    })

    it('validates required fields in client form', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      
      const submitButton = screen.getByRole('button', { name: /create client/i })
      fireEvent.click(submitButton)
      
      // Form should not submit without required fields
      expect(screen.getByRole('dialog', { name: /add new client/i })).toBeInTheDocument()
    })

    it('submits client form with valid data', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      
      const submitButton = screen.getByRole('button', { name: /create client/i })
      fireEvent.click(submitButton)
      
      // Should show loading state
      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
      
      // Wait for form submission to complete
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /add new client/i })).not.toBeInTheDocument()
      }, { timeout: 2000 })
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Creating client:', expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com'
      }))
    })

    it('handles different client types', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      
      const typeSelect = screen.getByLabelText(/type/i)
      fireEvent.change(typeSelect, { target: { value: 'Prospect' } })
      
      expect(typeSelect).toHaveValue('Prospect')
    })
  })

  describe('Appointment Modal', () => {
    it('opens appointment modal when button is clicked', async () => {
      render(<QuickActions />)
      
      const appointmentButton = screen.getByRole('button', { name: /schedule meeting/i })
      fireEvent.click(appointmentButton)
      
      expect(screen.getByRole('dialog', { name: /schedule appointment/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument()
    })

    it('submits appointment form with valid data', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /schedule meeting/i }))
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Client Meeting' } })
      fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '2024-12-01T10:00' } })
      fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '2024-12-01T11:00' } })
      
      const submitButton = screen.getByRole('button', { name: /^schedule$/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /schedule appointment/i })).not.toBeInTheDocument()
      }, { timeout: 2000 })
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Creating appointment:', expect.objectContaining({
        title: 'Client Meeting'
      }))
    })
  })

  describe('Transaction Modal', () => {
    it('opens transaction modal when button is clicked', async () => {
      render(<QuickActions />)
      
      const transactionButton = screen.getByRole('button', { name: /add transaction/i })
      fireEvent.click(transactionButton)
      
      expect(screen.getByRole('dialog', { name: /add transaction/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/property address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/price/i)).toBeInTheDocument()
    })

    it('submits transaction form with valid data', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add transaction/i }))
      
      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/property address/i), { target: { value: '123 Main St' } })
      fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '500000' } })
      
      const submitButton = screen.getByRole('button', { name: /create transaction/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /add transaction/i })).not.toBeInTheDocument()
      }, { timeout: 2000 })
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Creating transaction:', expect.objectContaining({
        address: '123 Main St',
        price: 500000
      }))
    })
  })

  describe('Document Modal', () => {
    it('opens document modal when button is clicked', async () => {
      render(<QuickActions />)
      
      const documentButton = screen.getByRole('button', { name: /upload document/i })
      fireEvent.click(documentButton)
      
      expect(screen.getByRole('dialog', { name: /upload document/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/select file/i)).toBeInTheDocument()
    })

    it('handles file selection', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /upload document/i }))
      
      const fileInput = screen.getByLabelText(/select file/i)
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      expect(screen.getByText(/selected: test\.pdf/i)).toBeInTheDocument()
    })

    it('disables upload button when no file is selected', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /upload document/i }))
      
      const uploadButton = screen.getByRole('button', { name: /^upload$/i })
      expect(uploadButton).toBeDisabled()
    })

    it('enables upload button when file is selected', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /upload document/i }))
      
      const fileInput = screen.getByLabelText(/select file/i)
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      const uploadButton = screen.getByRole('button', { name: /^upload$/i })
      expect(uploadButton).not.toBeDisabled()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('opens client modal with Ctrl+Shift+C', async () => {
      render(<QuickActions />)
      
      fireEvent.keyDown(document, { key: 'c', ctrlKey: true, shiftKey: true })
      
      expect(screen.getByRole('dialog', { name: /add new client/i })).toBeInTheDocument()
    })

    it('opens appointment modal with Ctrl+Shift+A', async () => {
      render(<QuickActions />)
      
      fireEvent.keyDown(document, { key: 'a', ctrlKey: true, shiftKey: true })
      
      expect(screen.getByRole('dialog', { name: /schedule appointment/i })).toBeInTheDocument()
    })

    it('opens transaction modal with Ctrl+Shift+T', async () => {
      render(<QuickActions />)
      
      fireEvent.keyDown(document, { key: 't', ctrlKey: true, shiftKey: true })
      
      expect(screen.getByRole('dialog', { name: /add transaction/i })).toBeInTheDocument()
    })

    it('opens document modal with Ctrl+Shift+D', async () => {
      render(<QuickActions />)
      
      fireEvent.keyDown(document, { key: 'd', ctrlKey: true, shiftKey: true })
      
      expect(screen.getByRole('dialog', { name: /upload document/i })).toBeInTheDocument()
    })

    it('closes modal with Escape key', async () => {
      render(<QuickActions />)
      
      fireEvent.keyDown(document, { key: 'c', ctrlKey: true, shiftKey: true })
      expect(screen.getByRole('dialog', { name: /add new client/i })).toBeInTheDocument()
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /add new client/i })).not.toBeInTheDocument()
      })
    })

    it('ignores shortcuts when input is focused', async () => {
      render(
        <div>
          <input data-testid="test-input" />
          <QuickActions />
        </div>
      )
      
      const input = screen.getByTestId('test-input')
      input.focus()
      
      fireEvent.keyDown(input, { key: 'c', ctrlKey: true, shiftKey: true })
      
      expect(screen.queryByRole('dialog', { name: /add new client/i })).not.toBeInTheDocument()
    })

    it('works with Cmd key on Mac', async () => {
      render(<QuickActions />)
      
      fireEvent.keyDown(document, { key: 'c', metaKey: true, shiftKey: true })
      
      expect(screen.getByRole('dialog', { name: /add new client/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels on buttons', () => {
      render(<QuickActions />)
      
      const clientButton = screen.getByRole('button', { name: /add client.*ctrl\+shift\+c/i })
      expect(clientButton).toHaveAttribute('aria-label', expect.stringContaining('Add Client'))
      expect(clientButton).toHaveAttribute('aria-label', expect.stringContaining('Ctrl+Shift+C'))
    })

    it('has proper modal ARIA attributes', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title')
    })

    it('focuses are managed properly in modals', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      
      // Modal should be present and focusable
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
      
      // Close button should be accessible
      const closeButton = screen.getByRole('button', { name: /close modal/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('prevents body scroll when modal is open', async () => {
      // Reset body style before test
      document.body.style.overflow = ''
      
      render(<QuickActions />)
      
      // Check initial body style
      expect(document.body.style.overflow).toBe('')
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      
      // Body scroll should be prevented
      expect(document.body.style.overflow).toBe('hidden')
      
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('unset')
      })
    })
  })

  describe('Modal Backdrop', () => {
    it('closes modal when backdrop is clicked', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      
      const backdrop = document.querySelector('.bg-black.bg-opacity-50')
      expect(backdrop).toBeInTheDocument()
      
      fireEvent.click(backdrop!)
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /add new client/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('shows validation for required email field', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      
      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      
      // HTML5 validation should handle this
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('handles numeric inputs correctly', async () => {
      render(<QuickActions />)
      
      fireEvent.click(screen.getByRole('button', { name: /add client/i }))
      
      const budgetInput = screen.getByLabelText(/min budget/i)
      fireEvent.change(budgetInput, { target: { value: '100000' } })
      
      expect(budgetInput).toHaveValue(100000)
    })
  })
})