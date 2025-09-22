import { NextRequest } from 'next/server'
import { PUT } from '../route'
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
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    insert: vi.fn()
  })),
  rpc: vi.fn()
}

;(createClient as any).mockReturnValue(mockSupabase)

describe('/api/clients/[id]/stage PUT', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update client stage successfully', async () => {
    // Mock authentication
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    // Mock profile fetch
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: { role: 'Admin' },
      error: null
    })

    // Mock current client fetch
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: {
        id: 'client-1',
        name: 'John Doe',
        type: 'Lead',
        assigned_agent: 'user-1'
      },
      error: null
    })

    // Mock client update
    mockSupabase.from().update().eq().select().single.mockResolvedValue({
      data: {
        id: 'client-1',
        name: 'John Doe',
        type: 'Prospect',
        stage_notes: 'Qualified lead'
      },
      error: null
    })

    // Mock RPC call for default deadline
    mockSupabase.rpc.mockResolvedValue({ error: null })

    // Mock activity insert
    mockSupabase.from().insert.mockResolvedValue({ error: null })

    const request = new NextRequest('http://localhost/api/clients/client-1/stage', {
      method: 'PUT',
      body: JSON.stringify({
        stage: 'Prospect',
        notes: 'Qualified lead'
      })
    })

    const response = await PUT(request, { params: { id: 'client-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Client stage updated successfully')
    expect(data.data.type).toBe('Prospect')
  })

  it('should return 401 for unauthenticated requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated')
    })

    const request = new NextRequest('http://localhost/api/clients/client-1/stage', {
      method: 'PUT',
      body: JSON.stringify({
        stage: 'Prospect'
      })
    })

    const response = await PUT(request, { params: { id: 'client-1' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 for invalid client ID', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    const request = new NextRequest('http://localhost/api/clients/invalid-id/stage', {
      method: 'PUT',
      body: JSON.stringify({
        stage: 'Prospect'
      })
    })

    const response = await PUT(request, { params: { id: 'invalid-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid client ID format')
  })

  it('should return 400 for invalid stage', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    const request = new NextRequest('http://localhost/api/clients/550e8400-e29b-41d4-a716-446655440000/stage', {
      method: 'PUT',
      body: JSON.stringify({
        stage: 'InvalidStage'
      })
    })

    const response = await PUT(request, { params: { id: '550e8400-e29b-41d4-a716-446655440000' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid stage value')
  })

  it('should return 404 for non-existent client', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: new Error('Not found')
    })

    const request = new NextRequest('http://localhost/api/clients/550e8400-e29b-41d4-a716-446655440000/stage', {
      method: 'PUT',
      body: JSON.stringify({
        stage: 'Prospect'
      })
    })

    const response = await PUT(request, { params: { id: '550e8400-e29b-41d4-a716-446655440000' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Client not found')
  })

  it('should return 403 for insufficient permissions', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-2' } },
      error: null
    })

    // Mock profile fetch
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: { role: 'Assistant' },
      error: null
    })

    // Mock current client fetch
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: {
        id: 'client-1',
        name: 'John Doe',
        type: 'Lead',
        assigned_agent: 'user-1' // Different user
      },
      error: null
    })

    const request = new NextRequest('http://localhost/api/clients/550e8400-e29b-41d4-a716-446655440000/stage', {
      method: 'PUT',
      body: JSON.stringify({
        stage: 'Prospect'
      })
    })

    const response = await PUT(request, { params: { id: '550e8400-e29b-41d4-a716-446655440000' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Insufficient permissions')
  })

  it('should handle database update errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    // Mock profile fetch
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: { role: 'Admin' },
      error: null
    })

    // Mock current client fetch
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: {
        id: 'client-1',
        name: 'John Doe',
        type: 'Lead',
        assigned_agent: 'user-1'
      },
      error: null
    })

    // Mock client update error
    mockSupabase.from().update().eq().select().single.mockResolvedValue({
      data: null,
      error: new Error('Database error')
    })

    const request = new NextRequest('http://localhost/api/clients/550e8400-e29b-41d4-a716-446655440000/stage', {
      method: 'PUT',
      body: JSON.stringify({
        stage: 'Prospect'
      })
    })

    const response = await PUT(request, { params: { id: '550e8400-e29b-41d4-a716-446655440000' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update client stage')
  })
})