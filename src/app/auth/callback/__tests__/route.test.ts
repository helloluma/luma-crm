import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'
import { supabase } from '@/lib/supabase'
import { emailService } from '@/lib/email'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn()
    }))
  }
}))

vi.mock('@/lib/email', () => ({
  emailService: {
    sendWelcomeEmail: vi.fn()
  }
}))

const mockSupabase = supabase as any
const mockEmailService = emailService as any

describe('OAuth Callback Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles successful OAuth callback for existing user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg'
      }
    }

    // Mock successful session exchange
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    // Mock existing profile found
    const mockProfileQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-123' },
            error: null
          })
        }))
      }))
    }
    mockSupabase.from.mockReturnValue(mockProfileQuery)

    const request = new NextRequest('https://example.com/auth/callback?code=auth_code_123')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/dashboard')
    expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth_code_123')
  })

  it('handles successful OAuth callback for new user', async () => {
    const mockUser = {
      id: 'user-456',
      email: 'newuser@example.com',
      user_metadata: {
        full_name: 'Jane Smith',
        avatar_url: 'https://example.com/avatar2.jpg'
      }
    }

    // Mock successful session exchange
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    // Mock no existing profile found
    const mockProfileQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }))
      }))
    }
    
    const mockInsertQuery = {
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
    }

    mockSupabase.from
      .mockReturnValueOnce(mockProfileQuery)
      .mockReturnValueOnce(mockInsertQuery)

    // Mock successful welcome email
    mockEmailService.sendWelcomeEmail.mockResolvedValue({ success: true })

    const request = new NextRequest('https://example.com/auth/callback?code=auth_code_456')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/dashboard')
    
    // Verify profile creation
    expect(mockInsertQuery.insert).toHaveBeenCalledWith({
      id: 'user-456',
      email: 'newuser@example.com',
      name: 'Jane Smith',
      role: 'Assistant',
      avatar_url: 'https://example.com/avatar2.jpg'
    })

    // Verify welcome email sent
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith('newuser@example.com', 'Jane Smith')
  })

  it('handles session exchange error', async () => {
    // Mock failed session exchange
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: null,
      error: { message: 'Invalid authorization code' }
    })

    const request = new NextRequest('https://example.com/auth/callback?code=invalid_code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/auth/login?error=auth_callback_error')
  })

  it('handles missing code parameter', async () => {
    const request = new NextRequest('https://example.com/auth/callback')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/auth/login?error=no_code')
    expect(mockSupabase.auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('continues authentication flow even if profile creation fails', async () => {
    const mockUser = {
      id: 'user-error',
      email: 'error@example.com',
      user_metadata: {
        full_name: 'Error User'
      }
    }

    // Mock successful session exchange
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    // Mock no existing profile found
    const mockProfileQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        }))
      }))
    }
    
    // Mock profile creation error
    const mockInsertQuery = {
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
    }

    mockSupabase.from
      .mockReturnValueOnce(mockProfileQuery)
      .mockReturnValueOnce(mockInsertQuery)

    const request = new NextRequest('https://example.com/auth/callback?code=auth_code_error')
    const response = await GET(request)

    // Should still redirect to dashboard despite profile creation error
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/dashboard')
  })

  it('handles unexpected errors', async () => {
    // Mock unexpected error during session exchange
    mockSupabase.auth.exchangeCodeForSession.mockRejectedValue(new Error('Network error'))

    const request = new NextRequest('https://example.com/auth/callback?code=network_error')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/auth/login?error=unexpected_error')
  })
})