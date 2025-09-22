import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ForgotPasswordForm from '../ForgotPasswordForm'
import { auth } from '@/lib/auth'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: {
    resetPassword: vi.fn()
  }
}))

const mockAuth = auth as any

describe('ForgotPasswordForm', () => {
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders forgot password form with email field', () => {
    render(<ForgotPasswordForm />)
    
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to log in/i })).toBeInTheDocument()
  })

  it('validates email field correctly', async () => {
    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    // Test empty email
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
    
    // Test invalid email format
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('handles successful password reset request', async () => {
    mockAuth.resetPassword.mockResolvedValue({
      data: {},
      error: null
    })

    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockAuth.resetPassword).toHaveBeenCalledWith('test@example.com')
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
    })
  })

  it('handles password reset error', async () => {
    mockAuth.resetPassword.mockResolvedValue({
      data: null,
      error: { message: 'User not found' }
    })

    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/no account found with this email address/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    mockAuth.resetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)
    
    // Check for loading state
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveClass('disabled:opacity-50')
  })

  it('calls back callback correctly', () => {
    render(<ForgotPasswordForm onBack={mockOnBack} />)
    
    const backButton = screen.getByRole('button', { name: /back to log in/i })
    fireEvent.click(backButton)
    
    expect(mockOnBack).toHaveBeenCalled()
  })

  it('displays success screen with instructions', async () => {
    mockAuth.resetPassword.mockResolvedValue({
      data: {},
      error: null
    })

    render(<ForgotPasswordForm onBack={mockOnBack} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
      expect(screen.getByText(/next steps/i)).toBeInTheDocument()
      expect(screen.getByText(/check your email inbox/i)).toBeInTheDocument()
      expect(screen.getByText(/click the reset link/i)).toBeInTheDocument()
      expect(screen.getByText(/create a new password/i)).toBeInTheDocument()
    })
    
    // Test back button on success screen
    const backButtonOnSuccess = screen.getByRole('button', { name: /back to log in/i })
    fireEvent.click(backButtonOnSuccess)
    expect(mockOnBack).toHaveBeenCalled()
  })

  it('handles generic error messages', async () => {
    mockAuth.resetPassword.mockResolvedValue({
      data: null,
      error: { message: 'Some other error' }
    })

    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/some other error/i)).toBeInTheDocument()
    })
  })

  it('handles network errors', async () => {
    mockAuth.resetPassword.mockRejectedValue(new Error('Network error'))

    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
    })
  })
})