import { NextRequest } from 'next/server'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { GET, POST } from '../route'
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
  insert: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  or: vi.fn(() => mockSupabase),
  ilike: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
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

describe('/api/clients', () => {
  describe('GET', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockClients = [
      {
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Lead',
        assigned_agent_profile: {
          id: 'user-123',
          name: 'Agent Name',
          email: 'agent@example.com'
        }
      }
    ]

    it('should return clients with pagination', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.single.mockResolvedValue({ data: mockClients, error: null, count: 1 })

      const request = new NextRequest('http://localhost/api/clients?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        data: mockClients,
        count: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      })
    })

    it('should apply search filter', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.single.mockResolvedValue({ data: [], error: null, count: 0 })

      const request = new NextRequest('http://localhost/api/clients?search=john')
      await GET(request)

      expect(mockSupabase.or).toHaveBeenCalledWith('name.ilike.%john%,email.ilike.%john%,phone.ilike.%john%')
    })

    it('should apply type filter', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.single.mockResolvedValue({ data: [], error: null, count: 0 })

      const request = new NextRequest('http://localhost/api/clients?type=Lead')
      await GET(request)

      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'Lead')
    })

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') })

      const request = new NextRequest('http://localhost/api/clients')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Database error'), count: null })

      const request = new NextRequest('http://localhost/api/clients')
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to fetch clients' })
    })

    it('should apply pagination correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockSupabase.single.mockResolvedValue({ data: [], error: null, count: 25 })

      const request = new NextRequest('http://localhost/api/clients?page=3&limit=5')
      await GET(request)

      expect(mockSupabase.range).toHaveBeenCalledWith(10, 14) // (3-1)*5 to (3-1)*5+5-1
    })
  })

  describe('POST', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockClientData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      type: 'Lead',
      source: 'Website'
    }

    it('should create a new client successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock check for existing client (should return null)
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      
      // Mock successful insert
      const mockCreatedClient = { id: 'client-1', ...mockClientData, assigned_agent: mockUser.id }
      mockSupabase.single.mockResolvedValueOnce({ data: mockCreatedClient, error: null })

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(mockClientData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data).toEqual(mockCreatedClient)
    })

    it('should return 400 for missing required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify({ name: 'John Doe' }) // Missing email
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Name and email are required' })
    })

    it('should return 400 for invalid email format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify({ name: 'John Doe', email: 'invalid-email' })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Invalid email format' })
    })

    it('should return 400 for invalid client type', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'John Doe', 
          email: 'john@example.com',
          type: 'InvalidType'
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Invalid client type' })
    })

    it('should return 400 for invalid budget range', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'John Doe', 
          email: 'john@example.com',
          budget_min: 500000,
          budget_max: 300000
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ 
        error: 'Minimum budget cannot be greater than maximum budget' 
      })
    })

    it('should return 409 for duplicate email', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock existing client found
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 'existing-client' }, 
        error: null 
      })

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(mockClientData)
      })
      const response = await POST(request)

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({ 
        error: 'A client with this email already exists' 
      })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: new Error('Not authenticated') 
      })

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(mockClientData)
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should handle database errors during creation', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock no existing client
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      
      // Mock database error during insert
      mockSupabase.single.mockResolvedValueOnce({ 
        data: null, 
        error: new Error('Database error') 
      })

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(mockClientData)
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to create client' })
    })

    it('should trim and normalize input data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock no existing client
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      
      // Mock successful insert
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 'client-1' }, 
        error: null 
      })

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: '  John Doe  ',
          email: '  JOHN@EXAMPLE.COM  ',
          phone: '  123-456-7890  ',
          source: '  Website  '
        })
      })
      await POST(request)

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          source: 'Website'
        })
      )
    })

    it('should set default values correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      // Mock no existing client
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      
      // Mock successful insert
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 'client-1' }, 
        error: null 
      })

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com'
        })
      })
      await POST(request)

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Lead',
          assigned_agent: mockUser.id,
          last_contact: null
        })
      )
    })
  })
})