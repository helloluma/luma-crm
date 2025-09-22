import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTransactions, useTransaction, useTransactionActions } from '../useTransactions'

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useTransactions', () => {
    it('should build correct URL with filters', async () => {
      const mockSWR = await import('swr')
      vi.mocked(mockSWR.default).mockReturnValue({
        data: {
          data: [],
          count: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      })

      const filters = {
        status: ['Active', 'Pending'],
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        price_min: 100000,
        price_max: 500000,
        search: 'Main St',
        page: 2,
        limit: 20,
        sort_by: 'price' as const,
        sort_order: 'asc' as const,
      }

      renderHook(() => useTransactions({ filters }))

      expect(mockSWR.default).toHaveBeenCalledWith(
        expect.stringContaining('/api/transactions?'),
        expect.any(Function),
        expect.any(Object)
      )

      const [url] = vi.mocked(mockSWR.default).mock.calls[0]
      expect(url).toContain('status=Active%2CPending')
      expect(url).toContain('client_id=123e4567-e89b-12d3-a456-426614174000')
      expect(url).toContain('price_min=100000')
      expect(url).toContain('price_max=500000')
      expect(url).toContain('search=Main+St')
      expect(url).toContain('page=2')
      expect(url).toContain('limit=20')
      expect(url).toContain('sort_by=price')
      expect(url).toContain('sort_order=asc')
    })

    it('should return default values when no data', async () => {
      const mockSWR = await import('swr')
      vi.mocked(mockSWR.default).mockReturnValue({
        data: null,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      })

      const { result } = renderHook(() => useTransactions())

      expect(result.current.transactions).toEqual([])
      expect(result.current.count).toBe(0)
      expect(result.current.page).toBe(1)
      expect(result.current.limit).toBe(10)
      expect(result.current.totalPages).toBe(0)
    })

    it('should not fetch when disabled', async () => {
      const mockSWR = await import('swr')
      vi.mocked(mockSWR.default).mockReturnValue({
        data: null,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      })

      renderHook(() => useTransactions({ enabled: false }))

      expect(mockSWR.default).toHaveBeenCalledWith(
        null,
        expect.any(Function),
        expect.any(Object)
      )
    })

    it('should handle empty filters', async () => {
      const mockSWR = await import('swr')
      vi.mocked(mockSWR.default).mockReturnValue({
        data: {
          data: [],
          count: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      })

      renderHook(() => useTransactions({ filters: {} }))

      const [url] = vi.mocked(mockSWR.default).mock.calls[0]
      expect(url).toBe('/api/transactions')
    })
  })

  describe('useTransaction', () => {
    it('should fetch single transaction when id provided', async () => {
      const mockSWR = await import('swr')
      vi.mocked(mockSWR.default).mockReturnValue({
        data: {
          data: {
            id: 'transaction-1',
            address: '123 Main St',
            price: 250000,
          },
        },
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      })

      const { result } = renderHook(() => useTransaction('transaction-1'))

      expect(mockSWR.default).toHaveBeenCalledWith(
        '/api/transactions/transaction-1',
        expect.any(Function),
        expect.any(Object)
      )

      expect(result.current.transaction).toEqual({
        id: 'transaction-1',
        address: '123 Main St',
        price: 250000,
      })
    })

    it('should not fetch when id is null', async () => {
      const mockSWR = await import('swr')
      vi.mocked(mockSWR.default).mockReturnValue({
        data: null,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      })

      renderHook(() => useTransaction(null))

      expect(mockSWR.default).toHaveBeenCalledWith(
        null,
        expect.any(Function),
        expect.any(Object)
      )
    })

    it('should return null transaction when no data', async () => {
      const mockSWR = await import('swr')
      vi.mocked(mockSWR.default).mockReturnValue({
        data: null,
        error: null,
        isLoading: false,
        mutate: vi.fn(),
      })

      const { result } = renderHook(() => useTransaction('transaction-1'))

      expect(result.current.transaction).toBeNull()
    })
  })

  describe('useTransactionActions', () => {
    beforeEach(() => {
      vi.mocked(fetch).mockClear()
    })

    describe('createTransaction', () => {
      it('should create transaction successfully', async () => {
        const mockTransaction = {
          id: 'transaction-1',
          address: '123 Main St',
          price: 250000,
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTransaction }),
        } as Response)

        const { result } = renderHook(() => useTransactionActions())

        const transactionData = {
          address: '123 Main St',
          client_id: '123e4567-e89b-12d3-a456-426614174000',
          price: 250000,
          commission_rate: 3.0,
        }

        const createdTransaction = await result.current.createTransaction(transactionData)

        expect(fetch).toHaveBeenCalledWith('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        })

        expect(createdTransaction).toEqual(mockTransaction)
      })

      it('should handle create transaction error', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Validation failed' }),
        } as Response)

        const { result } = renderHook(() => useTransactionActions())

        await expect(result.current.createTransaction({})).rejects.toThrow('Validation failed')
        
        await waitFor(() => {
          expect(result.current.error).toBe('Validation failed')
        })
      })
    })

    describe('updateTransaction', () => {
      it('should update transaction successfully', async () => {
        const mockTransaction = {
          id: 'transaction-1',
          address: '123 Main St',
          price: 275000,
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockTransaction }),
        } as Response)

        const { result } = renderHook(() => useTransactionActions())

        const updateData = { price: 275000 }
        const updatedTransaction = await result.current.updateTransaction('transaction-1', updateData)

        expect(fetch).toHaveBeenCalledWith('/api/transactions/transaction-1', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })

        expect(updatedTransaction).toEqual(mockTransaction)
      })

      it('should handle update transaction error', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Not found' }),
        } as Response)

        const { result } = renderHook(() => useTransactionActions())

        await expect(result.current.updateTransaction('transaction-1', {})).rejects.toThrow('Not found')
        
        await waitFor(() => {
          expect(result.current.error).toBe('Not found')
        })
      })
    })

    describe('deleteTransaction', () => {
      it('should delete transaction successfully', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Deleted successfully' }),
        } as Response)

        const { result } = renderHook(() => useTransactionActions())

        const success = await result.current.deleteTransaction('transaction-1')

        expect(fetch).toHaveBeenCalledWith('/api/transactions/transaction-1', {
          method: 'DELETE',
        })

        expect(success).toBe(true)
      })

      it('should handle delete transaction error', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Insufficient permissions' }),
        } as Response)

        const { result } = renderHook(() => useTransactionActions())

        await expect(result.current.deleteTransaction('transaction-1')).rejects.toThrow('Insufficient permissions')
        
        await waitFor(() => {
          expect(result.current.error).toBe('Insufficient permissions')
        })
      })
    })

    describe('calculateCommission', () => {
      it('should calculate commission successfully', async () => {
        const mockCalculation = {
          price: 250000,
          commission_rate: 3.0,
          broker_split: 20,
          gross_commission: 7500,
          broker_commission: 1500,
          net_commission: 6000,
        }

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockCalculation }),
        } as Response)

        const { result } = renderHook(() => useTransactionActions())

        const calculationData = {
          price: 250000,
          commission_rate: 3.0,
          broker_split: 20,
        }

        const calculation = await result.current.calculateCommission(calculationData)

        expect(fetch).toHaveBeenCalledWith('/api/transactions/calculate-commission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calculationData),
        })

        expect(calculation).toEqual(mockCalculation)
      })

      it('should handle calculate commission error', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Invalid parameters' }),
        } as Response)

        const { result } = renderHook(() => useTransactionActions())

        await expect(result.current.calculateCommission({
          price: 250000,
          commission_rate: 3.0,
        })).rejects.toThrow('Invalid parameters')
        
        await waitFor(() => {
          expect(result.current.error).toBe('Invalid parameters')
        })
      })
    })

    it('should manage loading state correctly', async () => {
      vi.mocked(fetch).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ data: {} }),
        } as Response), 100))
      )

      const { result } = renderHook(() => useTransactionActions())

      expect(result.current.isLoading).toBe(false)

      const promise = result.current.createTransaction({})
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await promise
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})