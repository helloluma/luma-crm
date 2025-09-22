import { useState, useCallback } from 'react'
import type { ClientType } from '@/types'

interface StageHistoryItem {
  id: string
  from_stage: string | null
  to_stage: string
  changed_by: string | null
  changed_at: string
  notes: string | null
  deadline: string | null
  changed_by_profile?: {
    name: string
    avatar_url?: string
  }
}

interface StageDeadline {
  id: string
  client_id: string
  stage: string
  deadline: string
  alert_sent: boolean
  alert_sent_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  created_by_profile?: {
    name: string
    avatar_url?: string
  }
}

export function useClientStage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateClientStage = useCallback(async (
    clientId: string,
    newStage: ClientType,
    notes?: string,
    deadline?: Date
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${clientId}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: newStage,
          notes,
          deadline: deadline?.toISOString()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update stage')
      }

      const data = await response.json()
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchStageHistory = useCallback(async (clientId: string): Promise<StageHistoryItem[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${clientId}/stage-history`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch stage history')
      }

      const data = await response.json()
      return data.data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setStageDeadline = useCallback(async (
    clientId: string,
    stage: ClientType,
    deadline: Date
  ) => {
    setIsLoading(true)
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
        throw new Error(errorData.error || 'Failed to set deadline')
      }

      const data = await response.json()
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchStageDeadlines = useCallback(async (clientId: string): Promise<StageDeadline[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${clientId}/deadlines`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch deadlines')
      }

      const data = await response.json()
      return data.data || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getStageProgress = useCallback((currentStage: ClientType) => {
    const stages = ['Lead', 'Prospect', 'Client', 'Closed']
    const currentIndex = stages.indexOf(currentStage)
    const progress = currentIndex >= 0 ? ((currentIndex + 1) / stages.length) * 100 : 0
    
    return {
      currentIndex,
      progress,
      stages,
      isComplete: currentStage === 'Closed'
    }
  }, [])

  const getNextStage = useCallback((currentStage: ClientType): ClientType | null => {
    const stages: ClientType[] = ['Lead', 'Prospect', 'Client', 'Closed']
    const currentIndex = stages.indexOf(currentStage)
    
    if (currentIndex >= 0 && currentIndex < stages.length - 1) {
      return stages[currentIndex + 1]
    }
    
    return null
  }, [])

  const getPreviousStage = useCallback((currentStage: ClientType): ClientType | null => {
    const stages: ClientType[] = ['Lead', 'Prospect', 'Client', 'Closed']
    const currentIndex = stages.indexOf(currentStage)
    
    if (currentIndex > 0) {
      return stages[currentIndex - 1]
    }
    
    return null
  }, [])

  const validateStageTransition = useCallback((
    fromStage: ClientType,
    toStage: ClientType
  ): { isValid: boolean; reason?: string } => {
    const stages: ClientType[] = ['Lead', 'Prospect', 'Client', 'Closed']
    const fromIndex = stages.indexOf(fromStage)
    const toIndex = stages.indexOf(toStage)

    // Allow moving to any stage (business rules may vary)
    if (fromIndex >= 0 && toIndex >= 0) {
      return { isValid: true }
    }

    return { 
      isValid: false, 
      reason: 'Invalid stage transition' 
    }
  }, [])

  return {
    isLoading,
    error,
    updateClientStage,
    fetchStageHistory,
    setStageDeadline,
    fetchStageDeadlines,
    getStageProgress,
    getNextStage,
    getPreviousStage,
    validateStageTransition
  }
}