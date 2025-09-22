import { useState, useCallback } from 'react'
import type { Client, ClientInsert, ClientUpdate, ClientWithAgent } from '@/types'

interface UseClientFormOptions {
  onSuccess?: (client: ClientWithAgent) => void
  onError?: (error: string) => void
}

interface UseClientFormReturn {
  createClient: (data: ClientInsert) => Promise<ClientWithAgent>
  updateClient: (id: string, data: ClientUpdate) => Promise<ClientWithAgent>
  deleteClient: (id: string) => Promise<void>
  loading: boolean
  error: string | null
}

export function useClientForm(options: UseClientFormOptions = {}): UseClientFormReturn {
  const { onSuccess, onError } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createClient = useCallback(async (data: ClientInsert): Promise<ClientWithAgent> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create client')
      }

      const result = await response.json()
      const client = result.data

      onSuccess?.(client)
      return client
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [onSuccess, onError])

  const updateClient = useCallback(async (id: string, data: ClientUpdate): Promise<ClientWithAgent> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update client')
      }

      const result = await response.json()
      const client = result.data

      onSuccess?.(client)
      return client
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [onSuccess, onError])

  const deleteClient = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete client')
      }

      // No need to call onSuccess for delete operations
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [onError])

  return {
    createClient,
    updateClient,
    deleteClient,
    loading,
    error
  }
}