import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useCSVOperations } from '../useCSVOperations'
import type { CSVTransaction } from '@/types'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock fetch
global.fetch = vi.fn()

describe('useCSVOperations', () => {
  const mockFetch = vi.mocked(fetch)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useCSVOperations())

    expect(result.current.importing).toBe(false)
    expect(result.current.error).toBe(null)
    expect(typeof result.current.importTransactions).toBe('function')
    expect(typeof result.current.clearError).toBe('function')
  })

  it('successfully imports transactions', async () => {
    const mockTransactions: CSVTransaction[] = [
      {
        address: '123 Main St',
        client_name: 'John Doe',
        client_id: 'client-1',
        price: 100000,
        commission_rate: 3.0,
        status: 'Active',
      },
    ]

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        message: 'Successfully imported 1 transactions',
        imported: 1,
        transactions: mockTransactions,
      }),
    }

    mockFetch.mockResolvedValue(mockResponse as any)

    const { result } = renderHook(() => useCSVOperations())

    let importResult: any
    await act(async () => {
      importResult = await result.current.importTransactions(mockTransactions)
    })

    expect(result.current.importing).toBe(false)
    expect(result.current.error).toBe(null)
    expect(importResult.imported).toBe(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/transactions/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions: mockTransactions }),
    })
  })

  it('sets importing state during import', async () => {
    const mockTransactions: CSVTransaction[] = [
      {
        address: '123 Main St',
        client_name: 'John Doe',
        price: 100000,
        commission_rate: 3.0,
      },
    ]

    // Create a promise that we can control
    let resolvePromise: (value: any) => void
    const controlledPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValue(controlledPromise as any)

    const { result } = renderHook(() => useCSVOperations())

    // Start import
    act(() => {
      result.current.importTransactions(mockTransactions)
    })

    // Should be importing
    expect(result.current.importing).toBe(true)
    expect(result.current.error).toBe(null)

    // Resolve the promise
    await act(async () => {
      resolvePromise({
        ok: true,
        json: () => Promise.resolve({ imported: 1 }),
      })
    })

    // Should no longer be importing
    expect(result.current.importing).toBe(false)
  })

  it('handles API errors', async () => {
    const mockTransactions: CSVTransaction[] = [
      {
        address: '123 Main St',
        client_name: 'John Doe',
        price: 100000,
        commission_rate: 3.0,
      },
    ]

    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: 'Clients not found',
      }),
    }

    mockFetch.mockResolvedValue(mockResponse as any)

    const { result } = renderHook(() => useCSVOperations())

    await act(async () => {
      try {
        await result.current.importTransactions(mockTransactions)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.importing).toBe(false)
    expect(result.current.error).toBe('Clients not found')
  })

  it('handles network errors', async () => {
    const mockTransactions: CSVTransaction[] = [
      {
        address: '123 Main St',
        client_name: 'John Doe',
        price: 100000,
        commission_rate: 3.0,
      },
    ]

    mockFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCSVOperations())

    await act(async () => {
      try {
        await result.current.importTransactions(mockTransactions)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.importing).toBe(false)
    expect(result.current.error).toBe('Network error')
  })

  it('handles API errors without error message', async () => {
    const mockTransactions: CSVTransaction[] = [
      {
        address: '123 Main St',
        client_name: 'John Doe',
        price: 100000,
        commission_rate: 3.0,
      },
    ]

    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    }

    mockFetch.mockResolvedValue(mockResponse as any)

    const { result } = renderHook(() => useCSVOperations())

    await act(async () => {
      try {
        await result.current.importTransactions(mockTransactions)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.importing).toBe(false)
    expect(result.current.error).toBe('Import failed')
  })

  it('handles errors without message property', async () => {
    const mockTransactions: CSVTransaction[] = [
      {
        address: '123 Main St',
        client_name: 'John Doe',
        price: 100000,
        commission_rate: 3.0,
      },
    ]

    // Mock an error without a message property
    const errorWithoutMessage = { name: 'CustomError' }
    mockFetch.mockRejectedValue(errorWithoutMessage)

    const { result } = renderHook(() => useCSVOperations())

    await act(async () => {
      try {
        await result.current.importTransactions(mockTransactions)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.importing).toBe(false)
    expect(result.current.error).toBe('Failed to import transactions')
  })

  it('clears error when clearError is called', async () => {
    const mockTransactions: CSVTransaction[] = [
      {
        address: '123 Main St',
        client_name: 'John Doe',
        price: 100000,
        commission_rate: 3.0,
      },
    ]

    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: 'Test error',
      }),
    }

    mockFetch.mockResolvedValue(mockResponse as any)

    const { result } = renderHook(() => useCSVOperations())

    // Cause an error
    await act(async () => {
      try {
        await result.current.importTransactions(mockTransactions)
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.error).toBe('Test error')

    // Clear the error
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBe(null)
  })

  it('throws error on import failure', async () => {
    const mockTransactions: CSVTransaction[] = [
      {
        address: '123 Main St',
        client_name: 'John Doe',
        price: 100000,
        commission_rate: 3.0,
      },
    ]

    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: 'Import failed',
      }),
    }

    mockFetch.mockResolvedValue(mockResponse as any)

    const { result } = renderHook(() => useCSVOperations())

    await expect(
      act(async () => {
        await result.current.importTransactions(mockTransactions)
      })
    ).rejects.toThrow('Import failed')
  })

  it('resets importing state even if import throws', async () => {
    const mockTransactions: CSVTransaction[] = [
      {
        address: '123 Main St',
        client_name: 'John Doe',
        price: 100000,
        commission_rate: 3.0,
      },
    ]

    mockFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCSVOperations())

    await act(async () => {
      try {
        await result.current.importTransactions(mockTransactions)
      } catch (error) {
        // Expected to throw
      }
    })

    // Should reset importing state even after error
    expect(result.current.importing).toBe(false)
  })
})