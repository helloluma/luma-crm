import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RegisterForm from '../RegisterForm'
import { auth } from '@/lib/auth'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: {
    signUp: vi.fn()
  }
}))

const mockAuth = auth as any

describe('RegisterForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders registration form with all required fields', () => {
    render(<RegisterForm />)
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('validates name field correctly', async () => {
    render(<RegisterForm />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Fill other required fields first
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    // Test short name
    fireEvent.change(nameInput, { target: { value: 'A' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('validates email field correctly', async () => {
    render(<RegisterForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Fill other required fields first
    const nameInput = screen.getByLabelText(/full name/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    // Test invalid email format
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('validates password requirements', async () => {
    render(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    
    // Test short password
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    
    await waitFor(() => {
      // Check that the length requirement is not met (should be gray/unchecked)
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
    render(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
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
    render(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
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
    render(<RegisterForm />)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Button should be disabled initially
    expect(submitButton).toBeDisabled()
    
    // Fill form with invalid data
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    
    // Button should still be disabled due to invalid password
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when all validation passes', async () => {
    render(<RegisterForm />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('handles successful registration', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: { id: '123', email: 'john@example.com' } },
      error: null
    })

    render(<RegisterForm onSuccess={mockOnSuccess} />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockAuth.signUp).toHaveBeenCalledWith(
        'john@example.com',
        'validpassword!',
        {
          name: 'John Doe',
          role: 'Assistant'
        }
      )
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('handles registration error', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'User already registered' }
    })

    render(<RegisterForm />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'validpassword!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'validpassword!' } })
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument()
    })
  })

  it('calls login callback correctly', () => {
    render(<RegisterForm onLogin={mockOnLogin} />)
    
    const loginButton = screen.getByText(/log in/i)
    fireEvent.click(loginButton)
    
    expect(mockOnLogin).toHaveBeenCalled()
  })

  it('allows role selection', () => {
    render(<RegisterForm />)
    
    const roleSelect = screen.getByLabelText(/role/i)
    
    fireEvent.change(roleSelect, { target: { value: 'Admin' } })
    expect(roleSelect).toHaveValue('Admin')
    
    fireEvent.change(roleSelect, { target: { value: 'SuperAdmin' } })
    expect(roleSelect).toHaveValue('SuperAdmin')
  })
})