import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LoginForm from '../LoginForm'
import { auth } from '@/lib/auth'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: {
    signIn: vi.fn(),
    signInWithOAuth: vi.fn()
  }
}))

const mockAuth = auth as any

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnForgotPassword = vi.fn()
  const mockOnRegister = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with all required fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  })

  it('validates email field correctly', async () => {
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
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

  it('validates password field correctly', async () => {
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
    // Fill valid email but leave password empty
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    render(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButtons = screen.getAllByRole('button')
    const eyeToggleButton = toggleButtons.find(button => 
      button.querySelector('svg') && !button.textContent?.trim()
    )
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    if (eyeToggleButton) {
      fireEvent.click(eyeToggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      fireEvent.click(eyeToggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })

  it('handles successful login', async () => {
    mockAuth.signIn.mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null
    })

    render(<LoginForm onSuccess={mockOnSuccess} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockAuth.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('handles login error', async () => {
    mockAuth.signIn.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' }
    })

    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('handles Google OAuth', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://oauth-url.com' },
      error: null
    })

    render(<LoginForm />)
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    fireEvent.click(googleButton)
    
    await waitFor(() => {
      expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith('google')
    })
  })

  it('calls callback functions correctly', () => {
    render(
      <LoginForm 
        onForgotPassword={mockOnForgotPassword}
        onRegister={mockOnRegister}
      />
    )
    
    const forgotPasswordButton = screen.getByText(/forgot password/i)
    const registerButton = screen.getByText(/register now/i)
    
    fireEvent.click(forgotPasswordButton)
    expect(mockOnForgotPassword).toHaveBeenCalled()
    
    fireEvent.click(registerButton)
    expect(mockOnRegister).toHaveBeenCalled()
  })

  it('shows loading state during submission', async () => {
    mockAuth.signIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 100)))

    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    // Check for loading state on the submit button specifically
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })
})