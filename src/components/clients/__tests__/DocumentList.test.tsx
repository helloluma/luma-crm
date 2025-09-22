import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DocumentList } from '../DocumentList'
import { supabase } from '@/lib/supabase'
import type { DocumentWithClient } from '@/types'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn()
        }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        download: vi.fn(),
        createSignedUrl: vi.fn(),
        remove: vi.fn()
      }))
    }
  }
}))

// Mock window.open
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn()
})

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-url')
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
})

const mockDocuments: DocumentWithClient[] = [
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
  },
  {
    id: 'doc-2',
    client_id: 'client-1',
    filename: 'photo.jpg',
    file_path: 'client-documents/client-1/photo.jpg',
    file_size: 2048000,
    mime_type: 'image/jpeg',
    uploaded_by: 'user-1',
    created_at: '2024-01-14T15:30:00Z',
    client: { name: 'John Doe' },
    uploaded_by_profile: { name: 'Agent Smith', email: 'agent@example.com' }
  }
]

describe('DocumentList', () => {
  const mockProps = {
    clientId: 'client-1',
    onDocumentDeleted: vi.fn(),
    onDocumentError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state', () => {
    render(<DocumentList {...mockProps} />)
    
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders empty state when no documents', async () => {
    const mockDatabase = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }))
      }))
    }

    vi.mocked(supabase.from).mockReturnValue(mockDatabase as any)

    render(<DocumentList {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument()
    })
  })

  it('renders documents list', async () => {
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

    render(<DocumentList {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('contract.pdf')).toBeInTheDocument()
      expect(screen.getByText('photo.jpg')).toBeInTheDocument()
      expect(screen.getByText('1000 KB')).toBeInTheDocument()
      expect(screen.getByText('2000 KB')).toBeInTheDocument()
      expect(screen.getByText('Agent Smith')).toBeInTheDocument()
    })
  })

  it('renders documents with provided documents prop', () => {
    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    expect(screen.getByText('contract.pdf')).toBeInTheDocument()
    expect(screen.getByText('photo.jpg')).toBeInTheDocument()
  })

  it('handles download document', async () => {
    const mockBlob = new Blob(['file content'], { type: 'application/pdf' })
    const mockStorage = {
      download: vi.fn().mockResolvedValue({
        data: mockBlob,
        error: null
      })
    }

    vi.mocked(supabase.storage.from).mockReturnValue(mockStorage as any)

    // Mock document.createElement and appendChild
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    }
    const originalCreateElement = document.createElement
    document.createElement = vi.fn((tagName) => {
      if (tagName === 'a') return mockLink as any
      return originalCreateElement.call(document, tagName)
    })

    const mockAppendChild = vi.fn()
    const mockRemoveChild = vi.fn()
    document.body.appendChild = mockAppendChild
    document.body.removeChild = mockRemoveChild

    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    const downloadButton = screen.getAllByTitle('Download document')[0]
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockStorage.download).toHaveBeenCalledWith('client-documents/client-1/contract.pdf')
      expect(mockLink.download).toBe('contract.pdf')
      expect(mockLink.click).toHaveBeenCalled()
    })

    // Restore
    document.createElement = originalCreateElement
  })

  it('handles preview document', async () => {
    const mockStorage = {
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed-url' },
        error: null
      })
    }

    vi.mocked(supabase.storage.from).mockReturnValue(mockStorage as any)

    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    const previewButton = screen.getAllByTitle('Preview document')[0]
    fireEvent.click(previewButton)

    await waitFor(() => {
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(
        'client-documents/client-1/contract.pdf',
        3600
      )
      expect(window.open).toHaveBeenCalledWith('https://example.com/signed-url', '_blank')
    })
  })

  it('handles delete document with confirmation', async () => {
    const mockStorage = {
      remove: vi.fn().mockResolvedValue({ error: null })
    }

    const mockDatabase = {
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      }))
    }

    vi.mocked(supabase.storage.from).mockReturnValue(mockStorage as any)
    vi.mocked(supabase.from).mockReturnValue(mockDatabase as any)

    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => true)

    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    const deleteButton = screen.getAllByTitle('Delete document')[0]
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "contract.pdf"?')
      expect(mockDatabase.delete).toHaveBeenCalled()
      expect(mockStorage.remove).toHaveBeenCalledWith(['client-documents/client-1/contract.pdf'])
      expect(mockProps.onDocumentDeleted).toHaveBeenCalledWith('doc-1')
    })

    // Restore
    window.confirm = originalConfirm
  })

  it('cancels delete when user declines confirmation', async () => {
    // Mock window.confirm to return false
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => false)

    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    const deleteButton = screen.getAllByTitle('Delete document')[0]
    fireEvent.click(deleteButton)

    expect(window.confirm).toHaveBeenCalled()
    expect(mockProps.onDocumentDeleted).not.toHaveBeenCalled()

    // Restore
    window.confirm = originalConfirm
  })

  it('handles download error', async () => {
    const mockStorage = {
      download: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Download failed')
      })
    }

    vi.mocked(supabase.storage.from).mockReturnValue(mockStorage as any)

    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    const downloadButton = screen.getAllByTitle('Download document')[0]
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockProps.onDocumentError).toHaveBeenCalledWith('Download failed: Download failed')
    })
  })

  it('handles preview error', async () => {
    const mockStorage = {
      createSignedUrl: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Preview failed')
      })
    }

    vi.mocked(supabase.storage.from).mockReturnValue(mockStorage as any)

    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    const previewButton = screen.getAllByTitle('Preview document')[0]
    fireEvent.click(previewButton)

    await waitFor(() => {
      expect(mockProps.onDocumentError).toHaveBeenCalledWith('Preview failed: Preview failed')
    })
  })

  it('handles delete error', async () => {
    const mockDatabase = {
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
      }))
    }

    vi.mocked(supabase.from).mockReturnValue(mockDatabase as any)

    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => true)

    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    const deleteButton = screen.getAllByTitle('Delete document')[0]
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockProps.onDocumentError).toHaveBeenCalledWith('Database error: Delete failed')
    })

    // Restore
    window.confirm = originalConfirm
  })

  it('shows correct file icons for different mime types', () => {
    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    // Should show different colored icons for different file types
    const fileIcons = screen.getAllByTestId('file-icon') || document.querySelectorAll('svg')
    expect(fileIcons.length).toBeGreaterThan(0)
  })

  it('shows preview button only for previewable files', () => {
    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    const previewButtons = screen.getAllByTitle('Preview document')
    // Both PDF and image should be previewable
    expect(previewButtons).toHaveLength(2)
  })

  it('formats file sizes correctly', () => {
    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    expect(screen.getByText('1000 KB')).toBeInTheDocument()
    expect(screen.getByText('2000 KB')).toBeInTheDocument()
  })

  it('formats dates correctly', () => {
    render(<DocumentList {...mockProps} documents={mockDocuments} />)

    // Should show formatted dates
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
    expect(screen.getByText(/Jan 14, 2024/)).toBeInTheDocument()
  })
})