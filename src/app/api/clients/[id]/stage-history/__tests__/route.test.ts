import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createClient } from '@/lib/supabase'

import { vi } from 'vitest'

// Mock Supabase
vi.mock('@/lib/supabase')
vi.mock('next/headers', () => ({
  cookies: () => ({})
}))

const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn()
      }))
    }))
  }))
}

;(createClient as any).mockReturnValue(mockSupabase)

describe('/api/clients/[id]/stage-history GET', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch stage history successfully', async () => {
    const mockHistory = [
      {
        id: 'history-1',
        from_stage: null,
        to_stage: 'Lead',
        changed_by: 'user-1',
        changed_at: '2024-01-01T00:00:00.000Z',
        notes: null,
        deadline: null,
        changed_by_profile: {
          name: 'John Doe',
          avatar_url: null
        }
      },
      {
        id: 'history-2',
        from_stage: 'Lead',
        to_stage: 'Prospect',
        changed_by: 'user-1',
        changed_at: '2024-01-02T00:00:00.000Z',
        notes: 'Qualified lead',
        deadline: '2024-01-15T00:00:00.000Z',
        changed_by_profile: {
          name: 'John Doe',
          avatar_url: null
        }
      }
    ]

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    mockSupabase.from().select().eq().order.mockResolvedValue({
      data: mockHistory,
      error: null
    })

    const request = new NextRequest('http://localhost/api/clients/client-1/stage-history')
    const response = await GET(request, { params: { id: 'client-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Stage history retrieved successfully')
    expect(data.data).toEqual(mockHistory)
    expect(data.data).toHaveLength(2)
  })

  it('should return 401 for unauthenticated requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated')
    })

    const request = new NextRequest('http://localhost/api/clients/client-1/stage-history')
    const response = await GET(request, { params: { id: 'client-1' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 for invalid client ID', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    const request = new NextRequest('http://localhost/api/clients/invalid-id/stage-history')
    const response = await GET(request, { params: { id: 'invalid-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid client ID format')
  })

  it('should handle database errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    mockSupabase.from().select().eq().order.mockResolvedValue({
      data: null,
      error: new Error('Database error')
    })

    const request = new NextRequest('http://localhost/api/clients/550e8400-e29b-41d4-a716-446655440000/stage-history')
    const response = await GET(request, { params: { id: '550e8400-e29b-41d4-a716-446655440000' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch stage history')
  })

  it('should return empty array when no history exists', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    mockSupabase.from().select().eq().order.mockResolvedValue({
      data: [],
      error: null
    })

    const request = new NextRequest('http://localhost/api/clients/550e8400-e29b-41d4-a716-446655440000/stage-history')
    const response = await GET(request, { params: { id: '550e8400-e29b-41d4-a716-446655440000' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toEqual([])
  })

  it('should handle null data from database', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    mockSupabase.from().select().eq().order.mockResolvedValue({
      data: null,
      error: null
    })

    const request = new NextRequest('http://localhost/api/clients/550e8400-e29b-41d4-a716-446655440000/stage-history')
    const response = await GET(request, { params: { id: '550e8400-e29b-41d4-a716-446655440000' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toEqual([])
  })
})