import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createClient } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn()
}))

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({}))
}))

describe('/api/deadlines/upcoming', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    gte: vi.fn(() => mockSupabase),
    lte: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    lt: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    single: vi.fn()
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com'
  }

  const mockProfile = {
    id: 'user-1',
    role: 'Assistant'
  }

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
    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated')
    })

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('fetches upcoming deadlines successfully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null
    })

    mockSupabase.limit.mockResolvedValue({
      data: mockDeadlines,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    
    expect(data.data).toHaveLength(2)
    expect(data.data[0]).toHaveProperty('priority')
    expect(data.data[0]).toHaveProperty('status')
    expect(data.data[0]).toHaveProperty('hours_until_deadline')
    expect(data.message).toBe('Deadlines retrieved successfully')
  })

  it('applies query parameters correctly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null
    })

    mockSupabase.limit.mockResolvedValue({
      data: [],
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming?limit=10&days=7&priority=high')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockSupabase.limit).toHaveBeenCalledWith(10)
  })

  it('filters by priority correctly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null
    })

    mockSupabase.limit.mockResolvedValue({
      data: [],
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming?priority=critical')
    const response = await GET(request)

    expect(response.status).toBe(200)
    // Should call lt for overdue items (critical priority)
    expect(mockSupabase.lt).toHaveBeenCalled()
  })

  it('restricts data for non-admin users', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.single.mockResolvedValue({
      data: { ...mockProfile, role: 'Assistant' },
      error: null
    })

    mockSupabase.limit.mockResolvedValue({
      data: [],
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming')
    const response = await GET(request)

    expect(response.status).toBe(200)
    // Should filter by assigned agent for non-admin users
    expect(mockSupabase.eq).toHaveBeenCalledWith('clients.assigned_agent', 'user-1')
  })

  it('allows admin users to see all deadlines', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.single.mockResolvedValue({
      data: { ...mockProfile, role: 'Admin' },
      error: null
    })

    mockSupabase.limit.mockResolvedValue({
      data: mockDeadlines,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming')
    const response = await GET(request)

    expect(response.status).toBe(200)
    // Should not filter by assigned agent for admin users
    expect(mockSupabase.eq).not.toHaveBeenCalledWith('clients.assigned_agent', 'user-1')
  })

  it('calculates priority and status correctly', async () => {
    const now = new Date()
    const testDeadlines = [
      {
        ...mockDeadlines[0],
        deadline: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago (overdue)
      },
      {
        ...mockDeadlines[1],
        deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now (urgent)
      }
    ]

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null
    })

    mockSupabase.limit.mockResolvedValue({
      data: testDeadlines,
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    
    expect(data.data[0].priority).toBe('critical')
    expect(data.data[0].status).toBe('overdue')
    expect(data.data[1].priority).toBe('high')
    expect(data.data[1].status).toBe('urgent')
  })

  it('handles database errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null
    })

    mockSupabase.limit.mockResolvedValue({
      data: null,
      error: new Error('Database error')
    })

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch deadlines')
  })

  it('handles missing profile gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: null
    })

    mockSupabase.limit.mockResolvedValue({
      data: [],
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming')
    const response = await GET(request)

    expect(response.status).toBe(200)
    // Should still work with null profile (treated as non-admin)
    expect(mockSupabase.eq).toHaveBeenCalledWith('clients.assigned_agent', 'user-1')
  })

  it('uses default query parameters when not provided', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null
    })

    mockSupabase.limit.mockResolvedValue({
      data: [],
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockSupabase.limit).toHaveBeenCalledWith(50) // Default limit
  })

  it('handles internal server errors', async () => {
    mockSupabase.auth.getUser.mockRejectedValue(new Error('Internal error'))

    const request = new NextRequest('http://localhost:3000/api/deadlines/upcoming')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Internal server error')
  })
})