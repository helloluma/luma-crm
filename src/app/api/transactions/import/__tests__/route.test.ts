import { NextRequest } from 'next/server'
import { vi } from 'vitest'
import { POST, GET } from '../route'
import { createClient } from '@/lib/supabase'
import { it } from 'zod/locales'
import { describe } from 'node:test'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock Supabase
vi.mock('@/lib/supabase')
const mockCreateClient = vi.mocked(createClient)

describe('/api/transactions/import', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)
  })

  describe('POST', () => {
    const validTransactionData = [
      {
        address: '123 Main St',
        client_name: 'John Doe',
        client_id: 'client-1',
        price: 100000,
        commission_rate: 3.0,
        net_commission: 2400,
        broker_commission: 600,
        status: 'Active',
      },
    ]

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions: validTransactionData }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 400 when no transactions provided', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions: [] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No transactions to import')
    })

    it('returns 400 when clients do not exist', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      // Mock client check to return empty result
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        insert: vi.fn(),
      })

      const request = new NextRequest('http://localhost/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions: validTransactionData }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Clients not found')
    })

    it('successfully imports transactions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      // Mock client check to return existing clients
      const mockClientSelect = {
        in: vi.fn(() => Promise.resolve({ 
          data: [{ id: 'client-1' }], 
          error: null 
        })),
      }

      // Mock transaction insert
      const mockTransactionInsert = {
        select: vi.fn(() => Promise.resolve({ 
          data: [
            {
              id: 'trans-1',
              address: '123 Main St',
              client_id: 'client-1',
              price: 100000,
              commission_rate: 3.0,
              client: { id: 'client-1', name: 'John Doe' },
            }
          ], 
          error: null 
        })),
      }

      // Mock activity insert
      const mockActivityInsert = Promise.resolve({ data: null, error: null })

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => mockClientSelect),
          insert: vi.fn(),
        })
        .mockReturnValueOnce({
          select: vi.fn(),
          insert: vi.fn(() => mockTransactionInsert),
        })
        .mockReturnValueOnce({
          select: vi.fn(),
          insert: vi.fn(() => mockActivityInsert),
        })

      const request = new NextRequest('http://localhost/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions: validTransactionData }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('Successfully imported')
      expect(data.imported).toBe(1)
      expect(data.transactions).toHaveLength(1)
    })

    it('handles database errors during client validation', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: new Error('Database error') 
          })),
        })),
        insert: vi.fn(),
      })

      const request = new NextRequest('http://localhost/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions: validTransactionData }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to validate clients')
    })

    it('handles database errors during transaction insertion', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const mockClientSelect = {
        in: vi.fn(() => Promise.resolve({ 
          data: [{ id: 'client-1' }], 
          error: null 
        })),
      }

      const mockTransactionInsert = {
        select: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: new Error('Insert failed') 
        })),
      }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => mockClientSelect),
          insert: vi.fn(),
        })
        .mockReturnValueOnce({
          select: vi.fn(),
          insert: vi.fn(() => mockTransactionInsert),
        })

      const request = new NextRequest('http://localhost/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions: validTransactionData }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to import transactions')
    })

    it('handles invalid request data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      const invalidData = [
        {
          // Missing required fields
          address: '',
          price: -100, // Invalid price
        },
      ]

      const request = new NextRequest('http://localhost/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions: invalidData }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid data format')
      expect(data.details).toBeDefined()
    })

    it('handles malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/transactions/import', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('processes large batches correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      })

      // Create 100 transactions to test batching
      const largeTransactionData = Array.from({ length: 100 }, (_, i) => ({
        address: `${i + 1} Test St`,
        client_name: 'John Doe',
        client_id: 'client-1',
        price: 100000 + i,
        commission_rate: 3.0,
        status: 'Active',
      }))

      const mockClientSelect = {
        in: vi.fn(() => Promise.resolve({ 
          data: [{ id: 'client-1' }], 
          error: null 
        })),
      }

      const mockTransactionInsert = {
        select: vi.fn(() => Promise.resolve({ 
          data: Array.from({ length: 50 }, (_, i) => ({ id: `trans-${i}` })), 
          error: null 
        })),
      }

      const mockActivityInsert = Promise.resolve({ data: null, error: null })

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => mockClientSelect),
          insert: vi.fn(),
        })
        .mockReturnValue({
          select: vi.fn(),
          insert: vi.fn(() => mockTransactionInsert),
        })

      // Add activity insert mock
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(),
        insert: vi.fn(() => mockActivityInsert),
      })

      const request = new NextRequest('http://localhost/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ transactions: largeTransactionData }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.imported).toBe(100) // 2 batches of 50 each
    })
  })

  describe('GET', () => {
    it('returns 405 for GET requests', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })
})