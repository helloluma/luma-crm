import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(),
        single: vi.fn()
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
}

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn(() => mockSupabase)
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

describe('/api/clients/[id]/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost/api/clients/client-1/documents')
      const response = await GET(request, { params: { id: 'client-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns documents for authenticated user', async () => {
      const mockUser = { id: 'user-123' }
      const mockDocuments = [
        {
          id: 'doc-1',
          filename: 'contract.pdf',
          client_id: 'client-1'
        }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: mockDocuments,
              error: null
            })
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockDatabase)

      const request = new NextRequest('http://localhost/api/clients/client-1/documents')
      const response = await GET(request, { params: { id: 'client-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockDocuments)
      expect(mockDatabase.select).toHaveBeenCalledWith(expect.stringContaining('*'))
    })

    it('handles database error', async () => {
      const mockUser = { id: 'user-123' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error')
            })
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockDatabase)

      const request = new NextRequest('http://localhost/api/clients/client-1/documents')
      const response = await GET(request, { params: { id: 'client-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch documents')
    })
  })

  describe('POST', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost/api/clients/client-1/documents', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          file_path: 'path/to/file'
        })
      })

      const response = await POST(request, { params: { id: 'client-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 400 when required fields are missing', async () => {
      const mockUser = { id: 'user-123' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost/api/clients/client-1/documents', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf'
          // missing file_path
        })
      })

      const response = await POST(request, { params: { id: 'client-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields: filename, file_path')
    })

    it('returns 404 when client not found', async () => {
      const mockUser = { id: 'user-123' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found')
            })
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockDatabase)

      const request = new NextRequest('http://localhost/api/clients/client-1/documents', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          file_path: 'path/to/file'
        })
      })

      const response = await POST(request, { params: { id: 'client-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Client not found')
    })

    it('creates document successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockClient = { id: 'client-1', assigned_agent: 'user-123' }
      const mockDocument = {
        id: 'doc-123',
        filename: 'test.pdf',
        file_path: 'path/to/file',
        client_id: 'client-1'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock client lookup
      const mockClientDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockClient,
              error: null
            })
          }))
        }))
      }

      // Mock document creation
      const mockDocumentDatabase = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockDocument,
              error: null
            })
          }))
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce(mockClientDatabase) // First call for client lookup
        .mockReturnValueOnce(mockDocumentDatabase) // Second call for document creation

      const request = new NextRequest('http://localhost/api/clients/client-1/documents', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          file_path: 'path/to/file',
          file_size: 1024,
          mime_type: 'application/pdf'
        })
      })

      const response = await POST(request, { params: { id: 'client-1' } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data).toEqual(mockDocument)
      expect(mockDocumentDatabase.insert).toHaveBeenCalledWith({
        client_id: 'client-1',
        filename: 'test.pdf',
        file_path: 'path/to/file',
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: 'user-123'
      })
    })

    it('handles document creation error', async () => {
      const mockUser = { id: 'user-123' }
      const mockClient = { id: 'client-1', assigned_agent: 'user-123' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock client lookup
      const mockClientDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockClient,
              error: null
            })
          }))
        }))
      }

      // Mock document creation error
      const mockDocumentDatabase = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error')
            })
          }))
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce(mockClientDatabase)
        .mockReturnValueOnce(mockDocumentDatabase)

      const request = new NextRequest('http://localhost/api/clients/client-1/documents', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          file_path: 'path/to/file'
        })
      })

      const response = await POST(request, { params: { id: 'client-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create document record')
    })
  })
})