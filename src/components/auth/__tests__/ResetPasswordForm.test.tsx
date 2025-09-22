import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ResetPasswordForm from '../ResetPasswordForm'
import { auth } from '@/lib/auth'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: {
    updatePassword: vi.fn()
  }
}))

const mockAuth = auth as any

describe('ResetPasswordForm', () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders reset password form with all required fields', () => {
    render(<ResetPasswordForm />)
    
    expect(screen.getByText(/set new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
  })

  it('validates password requirements', async () => {
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText(/new password/i)
    
    // Test short password
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    
    await waitFor(() => {
      const lengthCheck = screen.getByText(/must be at least 8 characters/i)
      expect(lengthCheck).toHaveClass('text-gray-500')
    })
    
    // Test password without special character
    fireEvent.change(passwordInput, { target: { value: 'longpassword' } })
    
    await waitFor(() => {
      const specialCheck = screen.getByText(/must contain one special character/i)
      expect(specialCheck).toHaveClass('text-gray-500')
    })
    
    // Test valid password
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    
    await waitFor(() => {
      const lengthCheck = screen.getByText(/must be at least 8 characters/i)
      const specialCheck = screen.getByText(/must contain one special character/i)
      expect(lengthCheck).toHaveClass('text-green-500')
      expect(specialCheck).toHaveClass('text-green-500')
    })
  })

  it('validates password confirmation', async () => {
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })
    
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword!' } })
    
    // Try to submit to trigger validation
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    })
    
    // Test matching passwords
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    await waitFor(() => {
      const matchCheck = screen.getByText(/passwords must match/i)
      expect(matchCheck).toHaveClass('text-green-500')
    })
  })

  it('toggles password visibility', () => {
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const allButtons = screen.getAllByRole('button')
    const eyeToggleButtons = allButtons.filter(button => 
      button.querySelector('svg') && !button.textContent?.trim()
    )
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    
    // Toggle password visibility
    if (eyeToggleButtons[0]) {
      fireEvent.click(eyeToggleButtons[0])
      expect(passwordInput).toHaveAttribute('type', 'text')
    }
    
    // Toggle confirm password visibility
    if (eyeToggleButtons[1]) {
      fireEvent.click(eyeToggleButtons[1])
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    }
  })

  it('disables submit button when validation fails', () => {
    render(<ResetPasswordForm />)
    
    const submitButton = screen.getByRole('button', { name: /update password/i })
    
    // Button should be disabled initially
    expect(submitButton).toBeDisabled()
    
    // Fill form with invalid data
    const passwordInput = screen.getByLabelText(/new password/i)
    
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    
    // Button should still be disabled due to invalid password
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when all validation passes', async () => {
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })
    
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('handles successful password update', async () => {
    mockAuth.updatePassword.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null
    })

    render(<ResetPasswordForm onSuccess={mockOnSuccess} />)
    
    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })
    
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockAuth.updatePassword).toHaveBeenCalledWith('validpassword!')
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('handles password update error', async () => {
    mockAuth.updatePassword.mockResolvedValue({
      data: null,
      error: { message: 'Password should be at least 8 characters' }
    })

    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })
    
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password does not meet security requirements/i)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    mockAuth.updatePassword.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 100)))

    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })
    
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    
    fireEvent.click(submitButton)
    
    // Check for loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })

  it('handles network errors', async () => {
    mockAuth.updatePassword.mockRejectedValue(new Error('Network error'))

    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /update password/i })
    
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
    })
  })
})