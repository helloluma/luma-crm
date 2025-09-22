import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useClients } from '../useClients'
import type { ClientWithAgent, PaginatedResponse } from '@/types'

// Mock fetch
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

// Mock data
const mockClients: ClientWithAgent[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    type: 'Lead',
    source: 'Website',
    budget_min: 100000,
    budget_max: 200000,
    preferred_area: 'Downtown',
    notes: 'Interested in condos',
    assigned_agent: 'agent1',
    last_contact: '2024-01-15T10:00:00Z',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    assigned_agent_profile: {
      id: 'agent1',
      name: 'Agent Smith',
      email: 'agent@example.com',
      role: 'Admin',
      avatar_url: null,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1987654321',
    type: 'Prospect',
    source: 'Referral',
    budget_min: 200000,
    budget_max: 300000,
    preferred_area: 'Suburbs',
    notes: 'Looking for family home',
    assigned_agent: 'agent1',
    last_contact: '2024-01-20T10:00:00Z',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    assigned_agent_profile: {
      id: 'agent1',
      name: 'Agent Smith',
      email: 'agent@example.com',
      role: 'Admin',
      avatar_url: null,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  }
]

const mockResponse: PaginatedResponse<ClientWithAgent> = {
  data: mockClients,
  count: 2,
  page: 1,
  limit: 12,
  totalPages: 1
}

describe('useClients', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => useClients({ autoFetch: false }))

    expect(result.current.clients).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.totalCount).toBe(0)
    expect(result.current.totalPages).toBe(0)
    expect(result.current.currentPage).toBe(1)
  })

  it('fetches clients on mount when autoFetch is true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useClients())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.clients).toEqual(mockClients)
    expect(result.current.totalCount).toBe(2)
    expect(result.current.totalPages).toBe(1)
    expect(mockFetch).toHaveBeenCalledWith('/api/clients?page=1&limit=12')
  })

  it('does not fetch on mount when autoFetch is false', () => {
    renderHook(() => useClients({ autoFetch: false }))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('builds query parameters correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useClients({
      page: 2,
      limit: 20,
      filters: {
        search: 'John',
        type: ['Lead'],
        assignedAgent: ['agent1'],
        source: ['Website']
      }
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/clients?page=2&limit=20&search=John&type=Lead&assignedAgent=agent1&source=Website'
    )
  })

  it('handles fetch errors', async () => {
    const errorMessage = 'Failed to fetch clients'
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage })
    } as Response)

    const { result } = renderHook(() => useClients())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.clients).toEqual([])
  })

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useClients())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.clients).toEqual([])
  })

  it('refetches data when refetch is called', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useClients())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    mockFetch.mockClear()

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('updates page correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useClients())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.setPage(2)
    })

    expect(result.current.currentPage).toBe(2)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/clients?page=2&limit=12')
    })
  })

  it('updates filters and resets page to 1', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useClients())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Set page to 2 first
    act(() => {
      result.current.setPage(2)
    })

    expect(result.current.currentPage).toBe(2)

    // Update filters should reset page to 1
    act(() => {
      result.current.setFilters({ search: 'John' })
    })

    expect(result.current.currentPage).toBe(1)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith('/api/clients?page=1&limit=12&search=John')
    })
  })

  it('clears filters and resets page', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useClients({
      filters: { search: 'John' },
      page: 2
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.currentPage).toBe(1)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith('/api/clients?page=1&limit=12')
    })
  })

  it('handles empty search filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useClients({
      filters: { search: '   ' } // Empty/whitespace search
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should not include search parameter for empty/whitespace search
    expect(mockFetch).toHaveBeenCalledWith('/api/clients?page=1&limit=12')
  })

  it('handles multiple filter types', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useClients({
      filters: {
        type: ['Lead', 'Prospect'],
        assignedAgent: ['agent1', 'agent2'],
        source: ['Website', 'Referral']
      }
    }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should use first item from each array (current API limitation)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/clients?page=1&limit=12&type=Lead&assignedAgent=agent1&source=Website'
    )
  })

  it('manually fetches data when fetchClients is called', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const { result } = renderHook(() => useClients({ autoFetch: false }))

    expect(mockFetch).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.fetchClients()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/clients?page=1&limit=12')
    expect(result.current.clients).toEqual(mockClients)
  })

  it('sets loading state correctly during fetch', async () => {
    let resolvePromise: (value: any) => void
    const fetchPromise = new Promise(resolve => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(fetchPromise as any)

    const { result } = renderHook(() => useClients())

    expect(result.current.loading).toBe(true)

    act(() => {
      resolvePromise!({
        ok: true,
        json: async () => mockResponse
      })
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})