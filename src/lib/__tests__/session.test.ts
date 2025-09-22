import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SessionManager, sessionUtils } from '../session'
import { supabase } from '../supabase'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      refreshSession: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))

const mockSupabase = supabase as any

describe('SessionManager', () => {
  let sessionManager: SessionManager
  let mockAuthStateChangeCallback: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock auth state change listener
    mockAuthStateChangeCallback = vi.fn()
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
      mockAuthStateChangeCallback = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    // Reset singleton instance
    ;(SessionManager as any).instance = null
    sessionManager = SessionManager.getInstance()
  })

  afterEach(() => {
    sessionManager.destroy()
  })

  it('initializes with loading state', () => {
    const currentSession = sessionManager.getCurrentSession()
    expect(currentSession.isLoading).toBe(true)
    expect(currentSession.session).toBe(null)
    expect(currentSession.user).toBe(null)
    expect(currentSession.profile).toBe(null)
  })

  it('handles successful session initialization', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    }

    const mockProfile = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'Admin'
    }

    // Mock successful session retrieval
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    // Mock successful profile retrieval
    const mockProfileQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        }))
      }))
    }
    mockSupabase.from.mockReturnValue(mockProfileQuery)

    // Create new instance to trigger initialization
    ;(SessionManager as any).instance = null
    sessionManager = SessionManager.getInstance()

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 0))

    const currentSession = sessionManager.getCurrentSession()
    expect(currentSession.isLoading).toBe(false)
    expect(currentSession.session).toEqual(mockSession)
    expect(currentSession.user).toEqual(mockSession.user)
    expect(currentSession.profile).toEqual(mockProfile)
    expect(currentSession.error).toBe(null)
  })

  it('handles session initialization error', async () => {
    // Mock session retrieval error
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Session error' }
    })

    // Create new instance to trigger initialization
    ;(SessionManager as any).instance = null
    sessionManager = SessionManager.getInstance()

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 0))

    const currentSession = sessionManager.getCurrentSession()
    expect(currentSession.isLoading).toBe(false)
    expect(currentSession.session).toBe(null)
    expect(currentSession.error).toBe('Session error')
  })

  it('subscribes to session changes', () => {
    const listener = vi.fn()
    const unsubscribe = sessionManager.subscribe(listener)

    // Should call listener immediately with current session
    expect(listener).toHaveBeenCalledWith(sessionManager.getCurrentSession())

    // Should be able to unsubscribe
    unsubscribe()
    expect(typeof unsubscribe).toBe('function')
  })

  it('handles auth state changes', async () => {
    const mockSession = {
      user: { id: 'user-456', email: 'new@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    }

    const mockProfile = {
      id: 'user-456',
      email: 'new@example.com',
      name: 'New User',
      role: 'Assistant'
    }

    // Mock profile retrieval
    const mockProfileQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        }))
      }))
    }
    mockSupabase.from.mockReturnValue(mockProfileQuery)

    // Simulate auth state change
    await mockAuthStateChangeCallback('SIGNED_IN', mockSession)

    const currentSession = sessionManager.getCurrentSession()
    expect(currentSession.session).toEqual(mockSession)
    expect(currentSession.user).toEqual(mockSession.user)
    expect(currentSession.profile).toEqual(mockProfile)
  })

  it('handles sign out', async () => {
    // Mock successful sign out
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    const result = await sessionManager.signOut()
    expect(result.error).toBe(null)
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('handles sign out error', async () => {
    const signOutError = new Error('Sign out failed')
    mockSupabase.auth.signOut.mockResolvedValue({ error: signOutError })

    const result = await sessionManager.signOut()
    expect(result.error).toBe(signOutError)
  })

  it('checks user roles correctly', () => {
    // Set up session with admin user
    const mockSessionData = {
      session: { user: { id: 'admin-user' } },
      user: { id: 'admin-user' },
      profile: { id: 'admin-user', role: 'Admin' },
      isLoading: false,
      error: null
    }

    // Mock getCurrentSession to return admin user
    vi.spyOn(sessionManager, 'getCurrentSession').mockReturnValue(mockSessionData as any)

    expect(sessionManager.hasRole(['Admin'])).toBe(true)
    expect(sessionManager.hasRole(['SuperAdmin'])).toBe(false)
    expect(sessionManager.hasRole(['Admin', 'SuperAdmin'])).toBe(true)
    expect(sessionManager.isAdmin()).toBe(true)
    expect(sessionManager.isSuperAdmin()).toBe(false)
  })

  it('handles session refresh', async () => {
    const mockRefreshedSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    }

    // Mock successful session refresh
    mockSupabase.auth.refreshSession.mockResolvedValue({
      data: { session: mockRefreshedSession },
      error: null
    })

    // Mock profile retrieval
    const mockProfileQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-123', role: 'Admin' },
            error: null
          })
        }))
      }))
    }
    mockSupabase.from.mockReturnValue(mockProfileQuery)

    // Access private method for testing
    await (sessionManager as any).refreshSession()

    expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
  })

  it('handles profile refresh', async () => {
    const mockProfile = {
      id: 'user-123',
      name: 'Updated User',
      role: 'SuperAdmin'
    }

    // Set up existing session
    const mockSessionData = {
      session: { user: { id: 'user-123' } },
      user: { id: 'user-123' },
      profile: { id: 'user-123', role: 'Admin' },
      isLoading: false,
      error: null
    }
    vi.spyOn(sessionManager, 'getCurrentSession').mockReturnValue(mockSessionData as any)

    // Mock profile retrieval
    const mockProfileQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        }))
      }))
    }
    mockSupabase.from.mockReturnValue(mockProfileQuery)

    const result = await sessionManager.refreshProfile()
    expect(result.error).toBe(null)
  })

  it('handles profile refresh without session', async () => {
    // Mock no session
    vi.spyOn(sessionManager, 'getCurrentSession').mockReturnValue({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      error: null
    })

    const result = await sessionManager.refreshProfile()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('No active session')
  })
})

describe('sessionUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides utility functions', () => {
    expect(typeof sessionUtils.getCurrentUser).toBe('function')
    expect(typeof sessionUtils.getCurrentProfile).toBe('function')
    expect(typeof sessionUtils.isAuthenticated).toBe('function')
    expect(typeof sessionUtils.hasRole).toBe('function')
    expect(typeof sessionUtils.isAdmin).toBe('function')
    expect(typeof sessionUtils.isSuperAdmin).toBe('function')
    expect(typeof sessionUtils.signOut).toBe('function')
    expect(typeof sessionUtils.refreshProfile).toBe('function')
  })
})