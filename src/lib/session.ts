import { supabase } from './supabase'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from './auth'

export interface SessionData {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
}

export class SessionManager {
  private static instance: SessionManager
  private refreshTimer: NodeJS.Timeout | null = null
  private listeners: Set<(sessionData: SessionData) => void> = new Set()
  private currentSessionData: SessionData = {
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    error: null
  }

  private constructor() {
    this.initializeSession()
    this.setupAuthListener()
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  private async initializeSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        this.updateSessionData({
          session: null,
          user: null,
          profile: null,
          isLoading: false,
          error: error.message
        })
        return
      }

      if (session) {
        await this.loadUserProfile(session)
        this.scheduleRefresh(session)
      } else {
        this.updateSessionData({
          session: null,
          user: null,
          profile: null,
          isLoading: false,
          error: null
        })
      }
    } catch (err) {
      this.updateSessionData({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Session initialization failed'
      })
    }
  }

  private async loadUserProfile(session: Session) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      this.updateSessionData({
        session,
        user: session.user,
        profile: profile || null,
        isLoading: false,
        error: error ? error.message : null
      })
    } catch (err) {
      this.updateSessionData({
        session,
        user: session.user,
        profile: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Profile loading failed'
      })
    }
  }

  private setupAuthListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)

      // Clear existing refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = null
      }

      if (session) {
        await this.loadUserProfile(session)
        this.scheduleRefresh(session)
      } else {
        this.updateSessionData({
          session: null,
          user: null,
          profile: null,
          isLoading: false,
          error: null
        })
      }
    })
  }

  private scheduleRefresh(session: Session) {
    if (!session.expires_at) return

    // Calculate time until token expires (refresh 5 minutes before expiry)
    const expiresAt = session.expires_at * 1000 // Convert to milliseconds
    const refreshAt = expiresAt - (5 * 60 * 1000) // 5 minutes before
    const timeUntilRefresh = refreshAt - Date.now()

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(async () => {
        await this.refreshSession()
      }, timeUntilRefresh)
    }
  }

  private async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh failed:', error)
        // Don't update session data on refresh failure - let it expire naturally
        return
      }

      if (data.session) {
        await this.loadUserProfile(data.session)
        this.scheduleRefresh(data.session)
      }
    } catch (err) {
      console.error('Session refresh error:', err)
    }
  }

  private updateSessionData(sessionData: SessionData) {
    this.currentSessionData = sessionData
    this.listeners.forEach(listener => listener(sessionData))
  }

  public subscribe(listener: (sessionData: SessionData) => void): () => void {
    this.listeners.add(listener)
    
    // Immediately call listener with current data
    listener(this.currentSessionData)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  public getCurrentSession(): SessionData {
    return this.currentSessionData
  }

  public async signOut(): Promise<{ error: Error | null }> {
    try {
      // Clear refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = null
      }

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return { error }
      }

      // Session data will be updated via auth state change listener
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign out failed') }
    }
  }

  public async refreshProfile(): Promise<{ error: Error | null }> {
    if (!this.currentSessionData.session) {
      return { error: new Error('No active session') }
    }

    try {
      await this.loadUserProfile(this.currentSessionData.session)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Profile refresh failed') }
    }
  }

  public hasRole(requiredRoles: string[]): boolean {
    const userRole = this.currentSessionData.profile?.role
    return userRole ? requiredRoles.includes(userRole) : false
  }

  public isAdmin(): boolean {
    return this.hasRole(['Admin', 'SuperAdmin'])
  }

  public isSuperAdmin(): boolean {
    return this.hasRole(['SuperAdmin'])
  }

  public destroy() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    this.listeners.clear()
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

// Utility functions for common session operations
export const sessionUtils = {
  getCurrentUser: () => sessionManager.getCurrentSession().user,
  getCurrentProfile: () => sessionManager.getCurrentSession().profile,
  isAuthenticated: () => !!sessionManager.getCurrentSession().session,
  hasRole: (roles: string[]) => sessionManager.hasRole(roles),
  isAdmin: () => sessionManager.isAdmin(),
  isSuperAdmin: () => sessionManager.isSuperAdmin(),
  signOut: () => sessionManager.signOut(),
  refreshProfile: () => sessionManager.refreshProfile()
}