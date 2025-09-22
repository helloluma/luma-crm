import { NextRequest } from 'next/server'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { GET, PUT, DELETE } from '../route'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// Mock dependencies
vi.mock('@/lib/supabase')
vi.mock('next/headers')

const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  neq: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase)
}

const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn()
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as any).mockReturnValue(mockSupabase)
  ;(cookies as any).mockResolvedValue(mockCookies)
})

describe('/api/clients/[id]', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' }
  const validClientId = '123e4567-e89b-12d3-a456-426614174000'
  const mockClient = {
    id: validClientId,
    name: 'John Doe',
    email: 'john@example.com',
    type: 'Lead',
    assigned_agent_profile: {
      id: 'user-123',
      name: 'Agent Name',
      email: 'agent@example.com'
    },
    documents: [],
    transactions: [],
    appointments: []
  }

  describe('GET', () => {
    it('should return client with related data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.single.mockResolvedValue({ data: mockClient, error: null })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`)
      const response = await GET(request, { params: { id: validClientId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockClient)
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('documents'))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('transactions'))
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('appointments'))
    })

    it('should return 400 for invalid UUID format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest('http://localhost/api/clients/invalid-id')
      const response = await GET(request, { params: { id: 'invalid-id' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Invalid client ID format' })
    })

    it('should return 404 when client not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`)
      const response = await GET(request, { params: { id: validClientId } })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Client not found' })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: new Error('Not authenticated') 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`)
      const response = await GET(request, { params: { id: validClientId } })

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`)
      const response = await GET(request, { params: { id: validClientId } })

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to fetch client' })
    })
  })

  describe('PUT', () => {
    const updateData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      type: 'Prospect'
    }

    it('should update client successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock existing client check
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: validClientId, email: 'john@example.com' }, 
        error: null 
      })
      
      // Mock no duplicate email
      mockSupabase.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116' } 
      })
      
      // Mock successful update
      const updatedClient = { ...mockClient, ...updateData }
      mockSupabase.single.mockResolvedValueOnce({ 
        data: updatedClient, 
        error: null 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const response = await PUT(request, { params: { id: validClientId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(updatedClient)
    })

    it('should return 400 for invalid UUID format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest('http://localhost/api/clients/invalid-id', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const response = await PUT(request, { params: { id: 'invalid-id' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Invalid client ID format' })
    })

    it('should return 400 for empty name', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: '   ' })
      })
      const response = await PUT(request, { params: { id: validClientId } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Name cannot be empty' })
    })

    it('should return 400 for invalid email format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`, {
        method: 'PUT',
        body: JSON.stringify({ email: 'invalid-email' })
      })
      const response = await PUT(request, { params: { id: validClientId } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Invalid email format' })
    })

    it('should return 400 for invalid client type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`, {
        method: 'PUT',
        body: JSON.stringify({ type: 'InvalidType' })
      })
      const response = await PUT(request, { params: { id: validClientId } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Invalid client type' })
    })

    it('should return 400 for invalid budget range', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          budget_min: 500000,
          budget_max: 300000
        })
      })
      const response = await PUT(request, { params: { id: validClientId } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ 
        error: 'Minimum budget cannot be greater than maximum budget' 
      })
    })

    it('should return 404 when client not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const response = await PUT(request, { params: { id: validClientId } })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Client not found' })
    })

    it('should return 409 for duplicate email', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock existing client check
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: validClientId, email: 'john@example.com' }, 
        error: null 
      })
      
      // Mock duplicate email found
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 'other-client-id' }, 
        error: null 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`, {
        method: 'PUT',
        body: JSON.stringify({ email: 'existing@example.com' })
      })
      const response = await PUT(request, { params: { id: validClientId } })

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({ 
        error: 'A client with this email already exists' 
      })
    })

    it('should trim and normalize input data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock existing client check
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: validClientId, email: 'john@example.com' }, 
        error: null 
      })
      
      // Mock no duplicate email
      mockSupabase.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116' } 
      })
      
      // Mock successful update
      mockSupabase.single.mockResolvedValueOnce({ 
        data: mockClient, 
        error: null 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: '  Jane Doe  ',
          email: '  JANE@EXAMPLE.COM  ',
          phone: '  987-654-3210  '
        })
      })
      await PUT(request, { params: { id: validClientId } })

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '987-654-3210'
        })
      )
    })
  })

  describe('DELETE', () => {
    it('should delete client successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock existing client check
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: validClientId }, 
        error: null 
      })
      
      // Mock no transactions check
      mockSupabase.limit.mockResolvedValueOnce({ 
        data: [], 
        error: null 
      })
      
      // Mock successful deletion
      mockSupabase.eq.mockResolvedValueOnce({ 
        data: null, 
        error: null 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`)
      const response = await DELETE(request, { params: { id: validClientId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Client deleted successfully')
    })

    it('should return 400 for invalid UUID format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest('http://localhost/api/clients/invalid-id')
      const response = await DELETE(request, { params: { id: 'invalid-id' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Invalid client ID format' })
    })

    it('should return 404 when client not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`)
      const response = await DELETE(request, { params: { id: validClientId } })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Client not found' })
    })

    it('should return 409 when client has transactions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock existing client check
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: validClientId }, 
        error: null 
      })
      
      // Mock transactions exist
      mockSupabase.limit.mockResolvedValueOnce({ 
        data: [{ id: 'transaction-1' }], 
        error: null 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`)
      const response = await DELETE(request, { params: { id: validClientId } })

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({ 
        error: 'Cannot delete client with existing transactions' 
      })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: new Error('Not authenticated') 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`)
      const response = await DELETE(request, { params: { id: validClientId } })

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should handle database errors during deletion', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock existing client check
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: validClientId }, 
        error: null 
      })
      
      // Mock no transactions check
      mockSupabase.limit.mockResolvedValueOnce({ 
        data: [], 
        error: null 
      })
      
      // Mock database error during deletion
      mockSupabase.eq.mockResolvedValueOnce({ 
        data: null, 
        error: new Error('Database error') 
      })

      const request = new NextRequest(`http://localhost/api/clients/${validClientId}`)
      const response = await DELETE(request, { params: { id: validClientId } })

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to delete client' })
    })
  })
})