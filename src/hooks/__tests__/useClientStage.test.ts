import { renderHook, act } from '@testing-library/react'
import { useClientStage } from '../useClientStage'
import { vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

describe('useClientStage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateClientStage', () => {
    it('should update client stage successfully', async () => {
      const mockResponse = {
        data: {
          id: 'client-1',
          type: 'Prospect',
          stage_notes: 'Test notes',
          stage_deadline: '2024-12-31T23:59:59.000Z'
        }
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const { result } = renderHook(() => useClientStage())

      let updatedClient
      await act(async () => {
        updatedClient = await result.current.updateClientStage(
          'client-1',
          'Prospect',
          'Test notes',
          new Date('2024-12-31T23:59:59.000Z')
        )
      })

      expect(fetch).toHaveBeenCalledWith('/api/clients/client-1/stage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: 'Prospect',
          notes: 'Test notes',
          deadline: '2024-12-31T23:59:59.000Z'
        }),
      })

      expect(updatedClient).toEqual(mockResponse.data)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle update errors', async () => {
      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' })
      })

      const { result } = renderHook(() => useClientStage())

      await act(async () => {
        try {
          await result.current.updateClientStage('client-1', 'Prospect')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('Unauthorized')
        }
      })

      expect(result.current.error).toBe('Unauthorized')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('fetchStageHistory', () => {
    it('should fetch stage history successfully', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          from_stage: 'Lead',
          to_stage: 'Prospect',
          changed_by: 'user-1',
          changed_at: '2024-01-01T00:00:00.000Z',
          notes: 'Qualified lead',
          deadline: null,
          changed_by_profile: {
            name: 'John Doe',
            avatar_url: null
          }
        }
      ]

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockHistory })
      })

      const { result } = renderHook(() => useClientStage())

      let history
      await act(async () => {
        history = await result.current.fetchStageHistory('client-1')
      })

      expect(fetch).toHaveBeenCalledWith('/api/clients/client-1/stage-history')
      expect(history).toEqual(mockHistory)
    })
  })

  describe('setStageDeadline', () => {
    it('should set stage deadline successfully', async () => {
      const mockDeadline = {
        id: 'deadline-1',
        client_id: 'client-1',
        stage: 'Prospect',
        deadline: '2024-12-31T23:59:59.000Z',
        created_by: 'user-1'
      }

      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDeadline })
      })

      const { result } = renderHook(() => useClientStage())

      let deadline
      await act(async () => {
        deadline = await result.current.setStageDeadline(
          'client-1',
          'Prospect',
          new Date('2024-12-31T23:59:59.000Z')
        )
      })

      expect(fetch).toHaveBeenCalledWith('/api/clients/client-1/deadlines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: 'Prospect',
          deadline: '2024-12-31T23:59:59.000Z'
        }),
      })

      expect(deadline).toEqual(mockDeadline)
    })
  })

  describe('getStageProgress', () => {
    it('should calculate stage progress correctly', () => {
      const { result } = renderHook(() => useClientStage())

      const leadProgress = result.current.getStageProgress('Lead')
      expect(leadProgress).toEqual({
        currentIndex: 0,
        progress: 25,
        stages: ['Lead', 'Prospect', 'Client', 'Closed'],
        isComplete: false
      })

      const prospectProgress = result.current.getStageProgress('Prospect')
      expect(prospectProgress).toEqual({
        currentIndex: 1,
        progress: 50,
        stages: ['Lead', 'Prospect', 'Client', 'Closed'],
        isComplete: false
      })

      const closedProgress = result.current.getStageProgress('Closed')
      expect(closedProgress).toEqual({
        currentIndex: 3,
        progress: 100,
        stages: ['Lead', 'Prospect', 'Client', 'Closed'],
        isComplete: true
      })
    })
  })

  describe('getNextStage', () => {
    it('should return next stage correctly', () => {
      const { result } = renderHook(() => useClientStage())

      expect(result.current.getNextStage('Lead')).toBe('Prospect')
      expect(result.current.getNextStage('Prospect')).toBe('Client')
      expect(result.current.getNextStage('Client')).toBe('Closed')
      expect(result.current.getNextStage('Closed')).toBe(null)
    })
  })

  describe('getPreviousStage', () => {
    it('should return previous stage correctly', () => {
      const { result } = renderHook(() => useClientStage())

      expect(result.current.getPreviousStage('Lead')).toBe(null)
      expect(result.current.getPreviousStage('Prospect')).toBe('Lead')
      expect(result.current.getPreviousStage('Client')).toBe('Prospect')
      expect(result.current.getPreviousStage('Closed')).toBe('Client')
    })
  })

  describe('validateStageTransition', () => {
    it('should validate stage transitions correctly', () => {
      const { result } = renderHook(() => useClientStage())

      const validTransition = result.current.validateStageTransition('Lead', 'Prospect')
      expect(validTransition).toEqual({ isValid: true })

      const backwardTransition = result.current.validateStageTransition('Client', 'Lead')
      expect(backwardTransition).toEqual({ isValid: true })

      const sameStage = result.current.validateStageTransition('Lead', 'Lead')
      expect(sameStage).toEqual({ isValid: true })
    })
  })
})