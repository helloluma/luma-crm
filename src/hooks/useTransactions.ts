import { useState, useCallback } from 'react'
import useSWR from 'swr'
import type { Transaction, TransactionFilters, PaginatedResponse, ApiResponse } from '@/types'

interface UseTransactionsOptions {
  filters?: Partial<TransactionFilters>
  enabled?: boolean
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { filters = {}, enabled = true } = options
  
  // Build query string from filters
  const queryParams = new URLSearchParams()
  
  if (filters.status?.length) {
    queryParams.set('status', filters.status.join(','))
  }
  if (filters.client_id) {
    queryParams.set('client_id', filters.client_id)
  }
  if (filters.price_min) {
    queryParams.set('price_min', filters.price_min.toString())
  }
  if (filters.price_max) {
    queryParams.set('price_max', filters.price_max.toString())
  }
  if (filters.closing_date_from) {
    queryParams.set('closing_date_from', filters.closing_date_from)
  }
  if (filters.closing_date_to) {
    queryParams.set('closing_date_to', filters.closing_date_to)
  }
  if (filters.search) {
    queryParams.set('search', filters.search)
  }
  if (filters.page) {
    queryParams.set('page', filters.page.toString())
  }
  if (filters.limit) {
    queryParams.set('limit', filters.limit.toString())
  }
  if (filters.sort_by) {
    queryParams.set('sort_by', filters.sort_by)
  }
  if (filters.sort_order) {
    queryParams.set('sort_order', filters.sort_order)
  }

  const queryString = queryParams.toString()
  const url = `/api/transactions${queryString ? `?${queryString}` : ''}`

  const fetcher = async (url: string): Promise<PaginatedResponse<Transaction>> => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch transactions')
    }
    return response.json()
  }

  const { data, error, isLoading, mutate } = useSWR(
    enabled ? url : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    transactions: data?.data || [],
    count: data?.count || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate,
  }
}

export function useTransaction(id: string | null) {
  const fetcher = async (url: string): Promise<ApiResponse<Transaction>> => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch transaction')
    }
    return response.json()
  }

  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/transactions/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    transaction: data?.data || null,
    isLoading,
    error,
    mutate,
  }
}

export function useTransactionActions() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTransaction = useCallback(async (data: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create transaction')
      }

      const result = await response.json()
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateTransaction = useCallback(async (id: string, data: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update transaction')
      }

      const result = await response.json()
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteTransaction = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete transaction')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const calculateCommission = useCallback(async (data: {
    price: number
    commission_rate: number
    broker_split?: number
  }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/transactions/calculate-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate commission')
      }

      const result = await response.json()
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate commission'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    calculateCommission,
    isLoading,
    error,
  }
}