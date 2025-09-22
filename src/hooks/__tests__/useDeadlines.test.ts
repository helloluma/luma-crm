import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useDeadlines } from '../useDeadlines'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useDeadlines', () => {
  const mockDeadlines = [
    {
      id: 'deadline-1',
      client_id: 'client-1',
      stage: 'Prospect',
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      alert_sent: false,
      alert_sent_at: null,
      created_by: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      priority: 'high',
      status: 'urgent',
      hours_until_deadline: 2,
      client: {
        id: 'client-1',
        name: 'John Doe',
        type: 'Prospect',
        assigned_agent: 'user-1'
      }
    },
    {
      id: 'deadline-2',
      client_id: 'client-2',
      stage: 'Client',
      deadline: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      alert_sent: true,
      alert_sent_at: '2024-01-01T12:00:00.000Z',
      created_by: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      priority: 'low',
      status: 'normal',
      hours_until_deadline: 25,
      client: {
        id: 'client-2',
        name: 'Jane Smith',
        type: 'Client',
        assigned_agent: 'user-1'
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchUpcomingDeadlines', () => {
    it('fetches upcoming deadlines successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockDeadlines })
      })

      const { result } = renderHook(() => useDeadlines())

      let deadlines
      await act(async () => {
        deadlines = await result.current.fetchUpcomingDeadlines()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/deadlines/upcoming?')
      expect(deadlines).toEqual(mockDeadlines)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('applies filters to the request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] })
      })

      const { result } = renderHook(() => useDeadlines())

      await act(async () => {
        await result.current.fetchUpcomingDeadlines({
          priority: 'high',
          days: 7,
          limit: 10
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/deadlines/upcoming?priority=high&days=7&limit=10')
    })

    it('handles fetch error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to fetch deadlines' })
      })

      const { result } = renderHook(() => useDeadlines())

      await act(async () => {
        try {
          await result.current.fetchUpcomingDeadlines()
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('Failed to fetch deadlines')
        }
      })

      expect(result.current.error).toBe('Failed to fetch deadlines')
      expect(result.current.loading).toBe(false)
    })

    it('handles network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useDeadlines())

      await act(async () => {
        try {
          await result.current.fetchUpcomingDeadlines()
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('Network error')
        }
      })

      expect(result.current.error).toBe('Network error')
    })
  })

  describe('createDeadline', () => {
    it('creates deadline successfully', async () => {
      const newDeadline = mockDeadlines[0]
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: newDeadline })
      })

      const { result } = renderHook(() => useDeadlines())

      let deadline
      await act(async () => {
        deadline = await result.current.createDeadline(
          'client-1',
          'Prospect',
          new Date('2024-12-31T23:59:59.000Z')
        )
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/clients/client-1/deadlines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: 'Prospect',
          deadline: '2024-12-31T23:59:59.000Z'
        }),
      })

      expect(deadline).toEqual(newDeadline)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('handles create error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to create deadline' })
      })

      const { result } = renderHook(() => useDeadlines())

      await act(async () => {
        try {
          await result.current.createDeadline(
            'client-1',
            'Prospect',
            new Date('2024-12-31T23:59:59.000Z')
          )
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('Failed to create deadline')
        }
      })

      expect(result.current.error).toBe('Failed to create deadline')
    })
  })

  describe('updateDeadline', () => {
    it('updates deadline successfully', async () => {
      const updatedDeadline = { ...mockDeadlines[0], deadline: '2024-12-31T23:59:59.000Z' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: updatedDeadline })
      })

      const { result } = renderHook(() => useDeadlines())

      let deadline
      await act(async () => {
        deadline = await result.current.updateDeadline('deadline-1', {
          deadline: new Date('2024-12-31T23:59:59.000Z'),
          stage: 'Client'
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/deadlines/deadline-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deadline: '2024-12-31T23:59:59.000Z',
          stage: 'Client'
        }),
      })

      expect(deadline).toEqual(updatedDeadline)
    })

    it('updates only deadline date', async () => {
      const updatedDeadline = mockDeadlines[0]
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: updatedDeadline })
      })

      const { result } = renderHook(() => useDeadlines())

      await act(async () => {
        await result.current.updateDeadline('deadline-1', {
          deadline: new Date('2024-12-31T23:59:59.000Z')
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/deadlines/deadline-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deadline: '2024-12-31T23:59:59.000Z'
        }),
      })
    })

    it('handles update error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to update deadline' })
      })

      const { result } = renderHook(() => useDeadlines())

      await act(async () => {
        try {
          await result.current.updateDeadline('deadline-1', {
            deadline: new Date('2024-12-31T23:59:59.000Z')
          })
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('Failed to update deadline')
        }
      })

      expect(result.current.error).toBe('Failed to update deadline')
    })
  })

  describe('deleteDeadline', () => {
    it('deletes deadline successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Deadline deleted successfully' })
      })

      const { result } = renderHook(() => useDeadlines())

      await act(async () => {
        await result.current.deleteDeadline('deadline-1')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/deadlines/deadline-1', {
        method: 'DELETE',
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('handles delete error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to delete deadline' })
      })

      const { result } = renderHook(() => useDeadlines())

      await act(async () => {
        try {
          await result.current.deleteDeadline('deadline-1')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('Failed to delete deadline')
        }
      })

      expect(result.current.error).toBe('Failed to delete deadline')
    })
  })

  describe('triggerDeadlineCheck', () => {
    it('triggers deadline check successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Deadline check completed' })
      })

      const { result } = renderHook(() => useDeadlines())

      await act(async () => {
        await result.current.triggerDeadlineCheck()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/deadlines/check', {
        method: 'GET',
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('handles trigger error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to trigger deadline check' })
      })

      const { result } = renderHook(() => useDeadlines())

      await act(async () => {
        try {
          await result.current.triggerDeadlineCheck()
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('Failed to trigger deadline check')
        }
      })

      expect(result.current.error).toBe('Failed to trigger deadline check')
    })
  })

  describe('getDeadlineStatus', () => {
    it('returns correct status for overdue deadline', () => {
      const { result } = renderHook(() => useDeadlines())

      const overdueDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      const status = result.current.getDeadlineStatus(overdueDate)

      expect(status).toEqual({
        status: 'overdue',
        priority: 'critical',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500'
      })
    })

    it('returns correct status for urgent deadline', () => {
      const { result } = renderHook(() => useDeadlines())

      const urgentDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      const status = result.current.getDeadlineStatus(urgentDate)

      expect(status).toEqual({
        status: 'urgent',
        priority: 'high',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500'
      })
    })

    it('returns correct status for upcoming deadline', () => {
      const { result } = renderHook(() => useDeadlines())

      const upcomingDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      const status = result.current.getDeadlineStatus(upcomingDate)

      expect(status).toEqual({
        status: 'upcoming',
        priority: 'medium',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500'
      })
    })

    it('returns correct status for normal deadline', () => {
      const { result } = renderHook(() => useDeadlines())

      const normalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const status = result.current.getDeadlineStatus(normalDate)

      expect(status).toEqual({
        status: 'normal',
        priority: 'low',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500'
      })
    })
  })

  describe('formatDeadlineTime', () => {
    it('formats overdue deadline correctly', () => {
      const { result } = renderHook(() => useDeadlines())

      const overdueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      const formatted = result.current.formatDeadlineTime(overdueDate)

      expect(formatted).toBe('2 days overdue')
    })

    it('formats today deadline correctly', () => {
      const { result } = renderHook(() => useDeadlines())

      const todayDate = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now (same day)
      const formatted = result.current.formatDeadlineTime(todayDate)

      expect(formatted).toBe('Due today')
    })

    it('formats tomorrow deadline correctly', () => {
      const { result } = renderHook(() => useDeadlines())

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(12, 0, 0, 0) // Set to noon tomorrow
      const tomorrowDate = tomorrow.toISOString()
      const formatted = result.current.formatDeadlineTime(tomorrowDate)

      expect(formatted).toBe('Due tomorrow')
    })

    it('formats near future deadline correctly', () => {
      const { result } = renderHook(() => useDeadlines())

      const nearFutureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      const formatted = result.current.formatDeadlineTime(nearFutureDate)

      expect(formatted).toBe('Due in 3 days')
    })

    it('formats far future deadline correctly', () => {
      const { result } = renderHook(() => useDeadlines())

      const farFutureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      const formatted = result.current.formatDeadlineTime(farFutureDate)

      expect(formatted).toBe(new Date(farFutureDate).toLocaleDateString())
    })
  })

  describe('loading and error states', () => {
    it('sets loading state during async operations', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValue(promise)

      const { result } = renderHook(() => useDeadlines())

      act(() => {
        result.current.fetchUpcomingDeadlines()
      })

      expect(result.current.loading).toBe(true)

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ data: [] })
        })
        await promise
      })

      expect(result.current.loading).toBe(false)
    })

    it('clears error on successful operation', async () => {
      const { result } = renderHook(() => useDeadlines())

      // First, cause an error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' })
      })

      await act(async () => {
        try {
          await result.current.fetchUpcomingDeadlines()
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.error).toBe('Test error')

      // Then, succeed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })

      await act(async () => {
        await result.current.fetchUpcomingDeadlines()
      })

      expect(result.current.error).toBe(null)
    })
  })
})