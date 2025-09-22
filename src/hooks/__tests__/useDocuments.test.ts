import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useDocuments } from '../useDocuments'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        createSignedUrl: vi.fn(),
        remove: vi.fn()
      }))
    },
    auth: {
      getUser: vi.fn()
    }
  }
}))

// Mock fetch for API calls
global.fetch = vi.fn()

const mockDocuments = [
  {
    id: 'doc-1',
    client_id: 'client-1',
    filename: 'contract.pdf',
    file_path: 'client-documents/client-1/contract.pdf',
    file_size: 1024000,
    mime_type: 'application/pdf',
    uploaded_by: 'user-1',
    created_at: '2024-01-15T10:00:00Z',
    client: { name: 'John Doe' },
    uploaded_by_profile: { name: 'Agent Smith', email: 'agent@example.com' }
  }
]

describe('useDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useDocuments({ autoFetch: false }))

    expect(result.current.documents).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('fetches documents on mount when clientId provided', async () => {
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

    vi.mocked(supabase.from).mockReturnValue(mockDatabase as any)

    const { result } = renderHook(() => 
      useDocuments({ clientId: 'client-1', autoFetch: true })
    )

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.documents).toEqual(mockDocuments)
      expect(result.current.error).toBe(null)
    })
  })

  it('handles fetch error', async () => {
    const mockDatabase = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Fetch failed')
          })
        }))
      }))
    }

    vi.mocked(supabase.from).mockReturnValue(mockDatabase as any)

    const { result } = renderHook(() => 
      useDocuments({ clientId: 'client-1', autoFetch: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Fetch failed')
      expect(result.current.documents).toEqual([])
    })
  })

  it('uploads document successfully', async () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const mockUser = { id: 'user-123' }
    const mockDocument = {
      id: 'doc-123',
      filename: 'test.pdf',
      client_id: 'client-1'
    }

    const mockStorage = {
      upload: vi.fn().mockResolvedValue({
        data: { path: 'client-documents/client-1/123-test.pdf' },
        error: null
      })
    }

    const mockDatabase = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockDocument,
            error: null
          })
        }))
      }))
    }

    vi.mocked(supabase.storage.from).mockReturnValue(mockStorage as any)
    vi.mocked(supabase.from).mockReturnValue(mockDatabase as any)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    const { result } = renderHook(() => 
      useDocuments({ clientId: 'client-1', autoFetch: false })
    )

    let uploadedDocument: any
    await act(async () => {
      uploadedDocument = await result.current.uploadDocument(mockFile, 'client-1')
    })

    expect(uploadedDocument).toEqual(mockDocument)
    expect(mockStorage.upload).toHaveBeenCalledWith(
      expect.stringContaining('client-documents/client-1/'),
      mockFile,
      { cacheControl: '3600', upsert: false }
    )
  })

  it('validates file size during upload', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { 
      type: 'application/pdf' 
    })

    const { result } = renderHook(() => useDocuments({ autoFetch: false }))

    await act(async () => {
      try {
        await result.current.uploadDocument(largeFile, 'client-1')
      } catch (error) {
        expect(error).toEqual(new Error('File size must be less than 10MB'))
      }
    })

    expect(result.current.error).toBe('File size must be less than 10MB')
  })

  it('validates file type during upload', async () => {
    const invalidFile = new File(['test'], 'test.exe', { 
      type: 'application/x-executable' 
    })

    const { result } = renderHook(() => useDocuments({ autoFetch: false }))

    await act(async () => {
      try {
        await result.current.uploadDocument(invalidFile, 'client-1')
      } catch (error) {
        expect(error).toEqual(new Error('File type not supported'))
      }
    })

    expect(result.current.error).toBe('File type not supported')
  })

  it('cleans up storage on database error during upload', async () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const mockUser = { id: 'user-123' }

    const mockStorage = {
      upload: vi.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null
      }),
      remove: vi.fn().mockResolvedValue({ error: null })
    }

    const mockDatabase = {
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        }))
      }))
    }

    vi.mocked(supabase.storage.from).mockReturnValue(mockStorage as any)
    vi.mocked(supabase.from).mockReturnValue(mockDatabase as any)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    const { result } = renderHook(() => useDocuments({ autoFetch: false }))

    await act(async () => {
      try {
        await result.current.uploadDocument(mockFile, 'client-1')
      } catch (error) {
        expect(error).toEqual(new Error('Database error: Database error'))
      }
    })

    expect(mockStorage.remove).toHaveBeenCalledWith(['test-path'])
  })

  it('deletes document successfully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Document deleted' })
    } as Response)

    const { result } = renderHook(() => useDocuments({ autoFetch: false }))

    // Set initial documents
    act(() => {
      result.current.documents = mockDocuments
    })

    await act(async () => {
      await result.current.deleteDocument('doc-1')
    })

    expect(fetch).toHaveBeenCalledWith('/api/documents/doc-1', {
      method: 'DELETE'
    })
  })

  it('handles delete error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Delete failed' })
    } as Response)

    const { result } = renderHook(() => useDocuments({ autoFetch: false }))

    await act(async () => {
      try {
        await result.current.deleteDocument('doc-1')
      } catch (error) {
        expect(error).toEqual(new Error('Delete failed'))
      }
    })

    expect(result.current.error).toBe('Delete failed')
  })

  it('downloads document successfully', async () => {
    const mockBlob = new Blob(['file content'])
    const mockStorage = {
      download: vi.fn().mockResolvedValue({
        data: mockBlob,
        error: null
      })
    }

    vi.mocked(supabase.storage.from).mockReturnValue(mockStorage as any)

    // Mock URL and document methods
    const mockUrl = 'mock-url'
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    }

    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => mockUrl)
    })

    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn()
    })

    const originalCreateElement = document.createElement
    document.createElement = vi.fn((tagName) => {
      if (tagName === 'a') return mockLink as any
      return originalCreateElement.call(document, tagName)
    })

    const mockAppendChild = vi.fn()
    const mockRemoveChild = vi.fn()
    document.body.appendChild = mockAppendChild
    document.body.removeChild = mockRemoveChild

    const { result } = renderHook(() => useDocuments({ autoFetch: false }))

    await act(async () => {
      await result.current.downloadDocument(mockDocuments[0] as any)
    })

    expect(mockStorage.download).toHaveBeenCalledWith('client-documents/client-1/contract.pdf')
    expect(mockLink.download).toBe('contract.pdf')
    expect(mockLink.click).toHaveBeenCalled()

    // Restore
    document.createElement = originalCreateElement
  })

  it('creates preview URL successfully', async () => {
    const mockStorage = {
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed-url' },
        error: null
      })
    }

    vi.mocked(supabase.storage.from).mockReturnValue(mockStorage as any)

    const { result } = renderHook(() => useDocuments({ autoFetch: false }))

    let previewUrl: string
    await act(async () => {
      previewUrl = await result.current.previewDocument(mockDocuments[0] as any)
    })

    expect(previewUrl!).toBe('https://example.com/signed-url')
    expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(
      'client-documents/client-1/contract.pdf',
      3600
    )
  })

  it('refreshes documents', async () => {
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

    vi.mocked(supabase.from).mockReturnValue(mockDatabase as any)

    const { result } = renderHook(() => 
      useDocuments({ clientId: 'client-1', autoFetch: false })
    )

    await act(async () => {
      await result.current.refreshDocuments()
    })

    expect(result.current.documents).toEqual(mockDocuments)
  })
})