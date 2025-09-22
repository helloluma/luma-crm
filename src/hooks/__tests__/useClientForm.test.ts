import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useClientForm } from '../useClientForm'
import type { ClientInsert, ClientUpdate, ClientWithAgent } from '@/types'

// Mock fetch
global.fetch = vi.fn()

const mockClient: ClientWithAgent = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-123-4567',
  type: 'Lead',
  source: 'Website',
  budget_min: 100000,
  budget_max: 500000,
  preferred_area: 'Downtown',
  notes: 'Interested in condos',
  assigned_agent: '456e7890-e89b-12d3-a456-426614174001',
  last_contact: '2024-01-15T10:00:00Z',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}

describe('useClientForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
  })

  describe('createClient', () => {
    it('successfully creates a client', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockClient })
      })

      const { result } = renderHook(() => 
        useClientForm({ onSuccess: mockOnSuccess, onError: mockOnError })
      )

      const clientData: ClientInsert = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Lead'
      }

      let createdClient: ClientWithAgent | undefined

      await act(async () => {
        createdClient = await result.current.createClient(clientData)
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      expect(createdClient).toEqual(mockClient)
      expect(mockOnSuccess).toHaveBeenCalledWith(mockClient)
      expect(mockOnError).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('handles create client error', async () => {
      const errorMessage = 'Email already exists'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage })
      })

      const { result } = renderHook(() => 
        useClientForm({ onSuccess: mockOnSuccess, onError: mockOnError })
      )

      const clientData: ClientInsert = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Lead'
      }

      await act(async () => {
        try {
          await result.current.createClient(clientData)
        } catch (error) {
          // Expected to throw
        }
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalledWith(errorMessage)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })

    it('handles network error during create', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => 
        useClientForm({ onSuccess: mockOnSuccess, onError: mockOnError })
      )

      const clientData: ClientInsert = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Lead'
      }

      await act(async () => {
        try {
          await result.current.createClient(clientData)
        } catch (error) {
          // Expected to throw
        }
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalledWith('Network error')
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Network error')
    })
  })

  describe('updateClient', () => {
    it('successfully updates a client', async () => {
      const updatedClient = { ...mockClient, name: 'John Updated' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: updatedClient })
      })

      const { result } = renderHook(() => 
        useClientForm({ onSuccess: mockOnSuccess, onError: mockOnError })
      )

      const updateData: ClientUpdate = {
        name: 'John Updated'
      }

      let updatedResult: ClientWithAgent | undefined

      await act(async () => {
        updatedResult = await result.current.updateClient(mockClient.id, updateData)
      })

      expect(global.fetch).toHaveBeenCalledWith(`/api/clients/${mockClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      expect(updatedResult).toEqual(updatedClient)
      expect(mockOnSuccess).toHaveBeenCalledWith(updatedClient)
      expect(mockOnError).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('handles update client error', async () => {
      const errorMessage = 'Client not found'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage })
      })

      const { result } = renderHook(() => 
        useClientForm({ onSuccess: mockOnSuccess, onError: mockOnError })
      )

      const updateData: ClientUpdate = {
        name: 'John Updated'
      }

      await act(async () => {
        try {
          await result.current.updateClient(mockClient.id, updateData)
        } catch (error) {
          // Expected to throw
        }
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalledWith(errorMessage)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('deleteClient', () => {
    it('successfully deletes a client', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Client deleted successfully' })
      })

      const { result } = renderHook(() => 
        useClientForm({ onSuccess: mockOnSuccess, onError: mockOnError })
      )

      await act(async () => {
        await result.current.deleteClient(mockClient.id)
      })

      expect(global.fetch).toHaveBeenCalledWith(`/api/clients/${mockClient.id}`, {
        method: 'DELETE',
      })

      expect(mockOnSuccess).not.toHaveBeenCalled() // Delete doesn't call onSuccess
      expect(mockOnError).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('handles delete client error', async () => {
      const errorMessage = 'Cannot delete client with existing transactions'
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage })
      })

      const { result } = renderHook(() => 
        useClientForm({ onSuccess: mockOnSuccess, onError: mockOnError })
      )

      await act(async () => {
        try {
          await result.current.deleteClient(mockClient.id)
        } catch (error) {
          // Expected to throw
        }
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalledWith(errorMessage)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('loading states', () => {
    it('sets loading to true during operations', async () => {
      // Mock a slow response
      ;(global.fetch as any).mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockClient })
          }), 100)
        )
      )

      const { result } = renderHook(() => useClientForm())

      const clientData: ClientInsert = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Lead'
      }

      // Start the operation
      act(() => {
        result.current.createClient(clientData)
      })

      // Should be loading
      expect(result.current.loading).toBe(true)

      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
      })

      // Should no longer be loading
      expect(result.current.loading).toBe(false)
    })
  })

  describe('error handling', () => {
    it('clears error on successful operation after previous error', async () => {
      const { result } = renderHook(() => useClientForm())

      // First, cause an error
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Some error' })
      })

      await act(async () => {
        try {
          await result.current.createClient({ name: 'Test', email: 'test@example.com', type: 'Lead' })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Some error')

      // Then, make a successful request
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockClient })
      })

      await act(async () => {
        await result.current.createClient({ name: 'Test', email: 'test@example.com', type: 'Lead' })
      })

      expect(result.current.error).toBe(null)
    })

    it('handles malformed error responses', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}) // No error field
      })

      const { result } = renderHook(() => 
        useClientForm({ onError: mockOnError })
      )

      await act(async () => {
        try {
          await result.current.createClient({ name: 'Test', email: 'test@example.com', type: 'Lead' })
        } catch (error) {
          // Expected to throw
        }
      })

      expect(mockOnError).toHaveBeenCalledWith('Failed to create client')
      expect(result.current.error).toBe('Failed to create client')
    })
  })

  describe('without callbacks', () => {
    it('works without onSuccess and onError callbacks', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockClient })
      })

      const { result } = renderHook(() => useClientForm())

      const clientData: ClientInsert = {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Lead'
      }

      let createdClient: ClientWithAgent | undefined

      await act(async () => {
        createdClient = await result.current.createClient(clientData)
      })

      expect(createdClient).toEqual(mockClient)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })
})