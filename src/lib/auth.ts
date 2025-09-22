import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from './supabase'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserRole = Profile['role']

// Authentication functions
export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData: { name: string; role?: UserRole }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role || 'Assistant'
        }
      }
    })
    return { data, error }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign in with OAuth provider
  async signInWithOAuth(provider: 'google' | 'github') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { data, error }
  },

  // Update password
  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return { data, error }
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }
}

// Profile functions
export const profiles = {
  // Get user profile
  async getProfile(userId: string): Promise<{ profile: Profile | null; error: any }> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { profile, error }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  // Get user role
  async getUserRole(userId: string): Promise<{ role: UserRole | null; error: any }> {
    const { data, error } = await supabase
      .rpc('get_user_role', { user_id: userId })
    
    return { role: data as UserRole, error }
  },

  // Check if user is admin
  async isAdmin(userId: string): Promise<{ isAdmin: boolean; error: any }> {
    const { data, error } = await supabase
      .rpc('is_admin', { user_id: userId })
    
    return { isAdmin: data || false, error }
  },

  // Check if user is super admin
  async isSuperAdmin(userId: string): Promise<{ isSuperAdmin: boolean; error: any }> {
    const { data, error } = await supabase
      .rpc('is_super_admin', { user_id: userId })
    
    return { isSuperAdmin: data || false, error }
  }
}

// Role-based access control helpers
export const rbac = {
  canViewAllClients: (role: UserRole) => ['SuperAdmin', 'Admin'].includes(role),
  canEditAllClients: (role: UserRole) => ['SuperAdmin', 'Admin'].includes(role),
  canDeleteClients: (role: UserRole) => ['SuperAdmin', 'Admin'].includes(role),
  canManageUsers: (role: UserRole) => role === 'SuperAdmin',
  canViewReports: (role: UserRole) => ['SuperAdmin', 'Admin'].includes(role),
  canManageSettings: (role: UserRole) => ['SuperAdmin', 'Admin'].includes(role)
}

// Session management
export const session = {
  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Refresh session
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    return { data, error }
  }
}