'use client'

import { useState, useCallback } from 'react'

export interface Deadline {
  id: string
  client_id: string
  stage: string
  deadline: string
  alert_sent: boolean
  alert_sent_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  priority?: string
  status?: string
  hours_until_deadline?: number
  client?: {
    id: string
    name: string
    type: string
    assigned_agent: string
  }
  created_by_profile?: {
    name: string
    avatar_url: string | null
  }
}

export interface DeadlineFilters {
  priority?: 'critical' | 'high' | 'medium' | 'low'
  days?: number
  limit?: number
}

export function useDeadlines() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUpcomingDeadlines = useCallback(async (filters: DeadlineFilters = {}): Promise<Deadline[]> => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.days) params.append('days', filters.days.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/deadlines/upcoming?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch deadlines')
      }

      const data = await response.json()
      return data.data || []

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deadlines'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createDeadline = useCallback(async (
    clientId: string,
    stage: string,
    deadline: Date
  ): Promise<Deadline> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${clientId}/deadlines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage,
          deadline: deadline.toISOString()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create deadline')
      }

      const data = await response.json()
      return data.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deadline'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDeadline = useCallback(async (
    deadlineId: string,
    updates: { deadline?: Date; stage?: string }
  ): Promise<Deadline> => {
    setLoading(true)
    setError(null)

    try {
      const body: any = {}
      if (updates.deadline) body.deadline = updates.deadline.toISOString()
      if (updates.stage) body.stage = updates.stage

      const response = await fetch(`/api/deadlines/${deadlineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update deadline')
      }

      const data = await response.json()
      return data.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deadline'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteDeadline = useCallback(async (deadlineId: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/deadlines/${deadlineId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete deadline')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deadline'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerDeadlineCheck = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/deadlines/check', {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to trigger deadline check')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger deadline check'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getDeadlineStatus = useCallback((deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 0) {
      return {
        status: 'overdue',
        priority: 'critical',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500'
      }
    } else if (diffHours < 24) {
      return {
        status: 'urgent',
        priority: 'high',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500'
      }
    } else if (diffHours < 72) {
      return {
        status: 'upcoming',
        priority: 'medium',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500'
      }
    } else {
      return {
        status: 'normal',
        priority: 'low',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500'
      }
    }
  }, [])

  const formatDeadlineTime = useCallback((deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else if (diffDays < 7) {
      return `Due in ${diffDays} days`
    } else {
      return date.toLocaleDateString()
    }
  }, [])

  return {
    loading,
    error,
    fetchUpcomingDeadlines,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    triggerDeadlineCheck,
    getDeadlineStatus,
    formatDeadlineTime
  }
}