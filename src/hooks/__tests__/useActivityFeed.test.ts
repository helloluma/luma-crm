import { renderHook, act, waitFor } from '@testing-library/react'
import { useActivityFeed } from '../useActivityFeed'
import { vi } from 'vitest'

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn()
      }))
    })),
    removeChannel: vi.fn()
  }
}))

// Mock fetch
global.fetch = vi.fn()

describe('useActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('initializes with correct default state', () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      })
    } as Response)

    const { result } = renderHook(() => useActivityFeed())

    expect(result.current.activities).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)
    expect(result.current.hasMore).toBe(true)
  })

  it('fetches activities on mount', async () => {
    const mockActivities = [
      {
        id: '1',
        type: 'client_created',
        title: 'Test Activity',
        description: 'Test Description',
        created_at: '2024-01-15T10:00:00Z',
        user: { id: 'user-1', name: 'Test User' }
      }
    ]

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockActivities,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      })
    } as Response)

    const { result } = renderHook(() => useActivityFeed())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.activities).toEqual(mockActivities)
    expect(result.current.error).toBe(null)
    expect(mockFetch).toHaveBeenCalledWith('/api/activities?page=1&limit=10')
  })

  it('handles fetch error', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch' })
    } as Response)

    const { result } = renderHook(() => useActivityFeed())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch')
    expect(result.current.activities).toEqual([])
  })

  it('applies filters correctly', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      })
    } as Response)

    renderHook(() => useActivityFeed({
      type: 'client_created',
      entityType: 'client',
      limit: 5
    }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/activities?page=1&limit=5&type=client_created&entity_type=client')
    })
  })

  it('loads more activities when loadMore is called', async () => {
    // Create 10 activities to match the limit so hasMore will be true
    const mockActivities = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      type: 'client_created',
      title: `Activity ${i + 1}`,
      created_at: '2024-01-15T10:00:00Z'
    }))
    const moreActivities = [
      { id: '11', type: 'client_updated', title: 'Activity 11', created_at: '2024-01-15T09:00:00Z' }
    ]

    const mockFetch = vi.mocked(fetch)
    // First call (initial load)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockActivities,
        pagination: { page: 1, limit: 10, total: 11, totalPages: 2 }
      })
    } as Response)

    const { result } = renderHook(() => useActivityFeed())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.activities).toEqual(mockActivities)
    expect(result.current.hasMore).toBe(true)

    // Second call (load more)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: moreActivities,
        pagination: { page: 2, limit: 10, total: 11, totalPages: 2 }
      })
    } as Response)

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.activities).toEqual([...mockActivities, ...moreActivities])
    expect(mockFetch).toHaveBeenCalledWith('/api/activities?page=2&limit=10')
  })

  it('refreshes activities when refresh is called', async () => {
    const initialActivities = [
      { id: '1', type: 'client_created', title: 'Activity 1', created_at: '2024-01-15T10:00:00Z' }
    ]
    const refreshedActivities = [
      { id: '2', type: 'client_updated', title: 'Activity 2', created_at: '2024-01-15T11:00:00Z' }
    ]

    const mockFetch = vi.mocked(fetch)
    // First call (initial load)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: initialActivities,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      })
    } as Response)

    const { result } = renderHook(() => useActivityFeed())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.activities).toEqual(initialActivities)

    // Second call (refresh)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: refreshedActivities,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      })
    } as Response)

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.activities).toEqual(refreshedActivities)
  })

  it('creates new activity when createActivity is called', async () => {
    const mockFetch = vi.mocked(fetch)
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      })
    } as Response)

    const { result } = renderHook(() => useActivityFeed())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const newActivity = {
      id: '1',
      type: 'client_created',
      title: 'New Activity',
      description: 'Test Description',
      created_at: '2024-01-15T10:00:00Z'
    }

    // Create activity call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: newActivity })
    } as Response)

    await act(async () => {
      await result.current.createActivity({
        type: 'client_created',
        title: 'New Activity',
        description: 'Test Description'
      })
    })

    expect(result.current.activities).toEqual([newActivity])
    expect(mockFetch).toHaveBeenLastCalledWith('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'client_created',
        title: 'New Activity',
        description: 'Test Description'
      })
    })
  })

  it('handles createActivity error', async () => {
    const mockFetch = vi.mocked(fetch)
    // Initial load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      })
    } as Response)

    const { result } = renderHook(() => useActivityFeed())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Create activity call with error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to create activity' })
    } as Response)

    await act(async () => {
      try {
        await result.current.createActivity({
          type: 'client_created',
          title: 'New Activity'
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    expect(result.current.error).toBe('Failed to create activity')
  })

  it('sets up realtime subscription when realtime is enabled', async () => {
    const { supabase } = await import('@/lib/supabase')
    const mockChannel = {
      on: vi.fn(() => ({
        subscribe: vi.fn()
      }))
    }
    vi.mocked(supabase.channel).mockReturnValue(mockChannel)

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      })
    } as Response)

    renderHook(() => useActivityFeed({ realtime: true }))

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith('activities')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities'
        },
        expect.any(Function)
      )
    })
  })

  it('does not set up realtime subscription when realtime is disabled', async () => {
    const { supabase } = await import('@/lib/supabase')
    
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      })
    } as Response)

    renderHook(() => useActivityFeed({ realtime: false }))

    await waitFor(() => {
      expect(supabase.channel).not.toHaveBeenCalled()
    })
  })

  it('sets hasMore to false when returned activities length is less than limit', async () => {
    const mockActivities = [
      { id: '1', type: 'client_created', title: 'Activity 1', created_at: '2024-01-15T10:00:00Z' }
    ]

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockActivities,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      })
    } as Response)

    const { result } = renderHook(() => useActivityFeed({ limit: 10 }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hasMore).toBe(false) // Only 1 activity returned, limit is 10
  })
})