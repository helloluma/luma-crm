import { useState, useEffect, useCallback } from 'react'
import type { ClientWithAgent, ClientFilters, PaginatedResponse } from '@/types'

interface UseClientsOptions {
  page?: number
  limit?: number
  filters?: ClientFilters
  autoFetch?: boolean
}

interface UseClientsReturn {
  clients: ClientWithAgent[]
  loading: boolean
  error: string | null
  totalCount: number
  totalPages: number
  currentPage: number
  fetchClients: () => Promise<void>
  refetch: () => Promise<void>
  setPage: (page: number) => void
  setFilters: (filters: ClientFilters) => void
  clearFilters: () => void
}

export function useClients(options: UseClientsOptions = {}): UseClientsReturn {
  const {
    page: initialPage = 1,
    limit = 12,
    filters: initialFilters = {},
    autoFetch = true
  } = options

  const [clients, setClients] = useState<ClientWithAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [filters, setFiltersState] = useState<ClientFilters>(initialFilters)

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    
    params.set('page', currentPage.toString())
    params.set('limit', limit.toString())

    if (filters.search && filters.search.trim()) {
      params.set('search', filters.search.trim())
    }

    if (filters.type && filters.type.length > 0) {
      // For multiple types, we'll need to handle this in the API
      params.set('type', filters.type[0]) // For now, just use the first type
    }

    if (filters.assignedAgent && filters.assignedAgent.length > 0) {
      params.set('assignedAgent', filters.assignedAgent[0])
    }

    if (filters.source && filters.source.length > 0) {
      params.set('source', filters.source[0])
    }

    return params.toString()
  }, [currentPage, limit, filters])

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = buildQueryParams()
      const response = await fetch(`/api/clients?${queryParams}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch clients')
      }

      const data: PaginatedResponse<ClientWithAgent> = await response.json()
      
      setClients(data.data)
      setTotalCount(data.count)
      setTotalPages(data.totalPages)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
    }
  }, [buildQueryParams])

  const refetch = useCallback(() => {
    return fetchClients()
  }, [fetchClients])

  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const setFilters = useCallback((newFilters: ClientFilters) => {
    setFiltersState(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState({})
    setCurrentPage(1)
  }, [])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchClients()
    }
  }, [fetchClients, autoFetch])

  return {
    clients,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    fetchClients,
    refetch,
    setPage,
    setFilters,
    clearFilters
  }
}