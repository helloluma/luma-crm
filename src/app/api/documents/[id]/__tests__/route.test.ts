import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, DELETE, PATCH } from '../route'

// Mock Supabase
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
    delete: vi.fn(() => ({
      eq: vi.fn()
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  })),
  storage: {
    from: vi.fn(() => ({
      remove: vi.fn()
    }))
  }
}

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn(() => mockSupabase)
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

describe('/api/documents/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost/api/documents/doc-1')
      const response = await GET(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 404 when document not found', async () => {
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

      const request = new NextRequest('http://localhost/api/documents/doc-1')
      const response = await GET(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Document not found')
    })

    it('returns document successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockDocument = {
        id: 'doc-1',
        filename: 'test.pdf',
        client: { name: 'John Doe', assigned_agent: 'user-123' }
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockDocument,
              error: null
            })
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(mockDatabase)

      const request = new NextRequest('http://localhost/api/documents/doc-1')
      const response = await GET(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockDocument)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost/api/documents/doc-1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 404 when document not found', async () => {
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

      const request = new NextRequest('http://localhost/api/documents/doc-1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Document not found')
    })

    it('returns 403 when user lacks permission', async () => {
      const mockUser = { id: 'user-123' }
      const mockDocument = {
        id: 'doc-1',
        uploaded_by: 'other-user',
        file_path: 'path/to/file',
        client: { assigned_agent: 'other-user' }
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock document fetch
      const mockDocumentDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockDocument,
              error: null
            })
          }))
        }))
      }

      // Mock user profile fetch
      const mockProfileDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'Assistant' },
              error: null
            })
          }))
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce(mockDocumentDatabase)
        .mockReturnValueOnce(mockProfileDatabase)

      const request = new NextRequest('http://localhost/api/documents/doc-1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions')
    })

    it('deletes document successfully when user is owner', async () => {
      const mockUser = { id: 'user-123' }
      const mockDocument = {
        id: 'doc-1',
        uploaded_by: 'user-123',
        file_path: 'path/to/file',
        client: { assigned_agent: 'user-123' }
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock document fetch
      const mockDocumentDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockDocument,
              error: null
            })
          }))
        }))
      }

      // Mock user profile fetch
      const mockProfileDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'Assistant' },
              error: null
            })
          }))
        }))
      }

      // Mock document deletion
      const mockDeleteDatabase = {
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      }

      // Mock storage deletion
      const mockStorage = {
        remove: vi.fn().mockResolvedValue({ error: null })
      }

      mockSupabase.from
        .mockReturnValueOnce(mockDocumentDatabase)
        .mockReturnValueOnce(mockProfileDatabase)
        .mockReturnValueOnce(mockDeleteDatabase)

      mockSupabase.storage.from.mockReturnValue(mockStorage)

      const request = new NextRequest('http://localhost/api/documents/doc-1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Document deleted successfully')
      expect(mockDeleteDatabase.delete).toHaveBeenCalled()
      expect(mockStorage.remove).toHaveBeenCalledWith(['path/to/file'])
    })

    it('deletes document successfully when user is admin', async () => {
      const mockUser = { id: 'user-123' }
      const mockDocument = {
        id: 'doc-1',
        uploaded_by: 'other-user',
        file_path: 'path/to/file',
        client: { assigned_agent: 'other-user' }
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock document fetch
      const mockDocumentDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockDocument,
              error: null
            })
          }))
        }))
      }

      // Mock user profile fetch (admin role)
      const mockProfileDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'Admin' },
              error: null
            })
          }))
        }))
      }

      // Mock document deletion
      const mockDeleteDatabase = {
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce(mockDocumentDatabase)
        .mockReturnValueOnce(mockProfileDatabase)
        .mockReturnValueOnce(mockDeleteDatabase)

      const request = new NextRequest('http://localhost/api/documents/doc-1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Document deleted successfully')
    })

    it('handles database deletion error', async () => {
      const mockUser = { id: 'user-123' }
      const mockDocument = {
        id: 'doc-1',
        uploaded_by: 'user-123',
        file_path: 'path/to/file'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock document fetch
      const mockDocumentDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockDocument,
              error: null
            })
          }))
        }))
      }

      // Mock user profile fetch
      const mockProfileDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'Assistant' },
              error: null
            })
          }))
        }))
      }

      // Mock document deletion error
      const mockDeleteDatabase = {
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce(mockDocumentDatabase)
        .mockReturnValueOnce(mockProfileDatabase)
        .mockReturnValueOnce(mockDeleteDatabase)

      const request = new NextRequest('http://localhost/api/documents/doc-1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete document')
    })
  })

  describe('PATCH', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost/api/documents/doc-1', {
        method: 'PATCH',
        body: JSON.stringify({ filename: 'new-name.pdf' })
      })
      const response = await PATCH(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 400 when no valid fields to update', async () => {
      const mockUser = { id: 'user-123' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const request = new NextRequest('http://localhost/api/documents/doc-1', {
        method: 'PATCH',
        body: JSON.stringify({}) // No filename
      })
      const response = await PATCH(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No valid fields to update')
    })

    it('updates document successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockDocument = {
        id: 'doc-1',
        uploaded_by: 'user-123',
        client: { assigned_agent: 'user-123' }
      }
      const mockUpdatedDocument = {
        ...mockDocument,
        filename: 'new-name.pdf'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock document fetch
      const mockDocumentDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockDocument,
              error: null
            })
          }))
        }))
      }

      // Mock user profile fetch
      const mockProfileDatabase = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'Assistant' },
              error: null
            })
          }))
        }))
      }

      // Mock document update
      const mockUpdateDatabase = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedDocument,
                error: null
              })
            }))
          }))
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce(mockDocumentDatabase)
        .mockReturnValueOnce(mockProfileDatabase)
        .mockReturnValueOnce(mockUpdateDatabase)

      const request = new NextRequest('http://localhost/api/documents/doc-1', {
        method: 'PATCH',
        body: JSON.stringify({ filename: 'new-name.pdf' })
      })
      const response = await PATCH(request, { params: { id: 'doc-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockUpdatedDocument)
      expect(mockUpdateDatabase.update).toHaveBeenCalledWith({ filename: 'new-name.pdf' })
    })
  })
})