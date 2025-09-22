import { useState } from 'react'
import type { CSVTransaction } from '@/types'

interface UseCSVOperationsReturn {
  importing: boolean
  importTransactions: (data: CSVTransaction[]) => Promise<void>
  error: string | null
  clearError: () => void
}

export function useCSVOperations(): UseCSVOperationsReturn {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const importTransactions = async (data: CSVTransaction[]) => {
    setImporting(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions: data }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      // Optionally trigger a refresh of transactions data
      // This could be handled by the parent component or through a global state update
      
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to import transactions'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setImporting(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    importing,
    importTransactions,
    error,
    clearError,
  }
}