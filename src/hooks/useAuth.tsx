'use client'

import React, { useState, useEffect, useContext, createContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { sessionManager, type SessionData } from '@/lib/session'
import type { Profile, UserRole } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
  signOut: () => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,
  signOut: async () => ({ error: null }),
  refreshProfile: async () => ({ error: null })
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessionData, setSessionData] = useState<SessionData>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    // Subscribe to session changes
    const unsubscribe = sessionManager.subscribe((data: SessionData) => {
      setSessionData(data)
    })

    return unsubscribe
  }, [])

  const signOut = async () => {
    return await sessionManager.signOut()
  }

  const refreshProfile = async () => {
    return await sessionManager.refreshProfile()
  }

  const value: AuthContextType = {
    user: sessionData.user,
    profile: sessionData.profile,
    session: sessionData.session,
    loading: sessionData.isLoading,
    error: sessionData.error,
    signOut,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook for role-based access control
export const useRole = () => {
  const { profile } = useAuth()
  
  const role = profile?.role || 'Assistant'
  const isAdmin = role === 'Admin' || role === 'SuperAdmin'
  const isSuperAdmin = role === 'SuperAdmin'
  
  return {
    role,
    isAdmin,
    isSuperAdmin,
    canViewAllClients: isAdmin,
    canEditAllClients: isAdmin,
    canDeleteClients: isAdmin,
    canManageUsers: isSuperAdmin,
    canViewReports: isAdmin,
    canManageSettings: isAdmin,
    hasRole: (requiredRoles: UserRole[]) => requiredRoles.includes(role),
    hasAnyRole: (requiredRoles: UserRole[]) => requiredRoles.some(r => r === role)
  }
}