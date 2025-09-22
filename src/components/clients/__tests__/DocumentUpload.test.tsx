import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DocumentUpload } from '../DocumentUpload'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn()
      }))
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    auth: {
      getUser: vi.fn()
    }
  }
}))

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn()
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

const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

describe('DocumentUpload', () => {
  const mockProps = {
    clientId: 'test-client-id',
    onUploadComplete: vi.fn(),
    onUploadError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation
    const { useDropzone } = require('react-dropzone')
    useDropzone.mockReturnValue({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders upload area correctly', () => {
    render(<DocumentUpload {...mockProps} />)
    
    expect(screen.getByText('Drag & drop files here, or click to select files')).toBeInTheDocument()
    expect(screen.getByText('Max file size: 10MB')).toBeInTheDocument()
    expect(screen.getByText('Supported: PDF, DOC, DOCX, Images, TXT')).toBeInTheDocument()
  })

  it('shows drag active state', () => {
    const { useDropzone } = require('react-dropzone')
    useDropzone.mockReturnValue({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: true
    })

    render(<DocumentUpload {...mockProps} />)
    
    expect(screen.getByText('Drop the files here...')).toBeInTheDocument()
  })

  it('validates file size correctly', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { 
      type: 'application/pdf' 
    })

    let onDropCallback: (files: File[]) => void

    const { useDropzone } = require('react-dropzone')
    useDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false
      }
    })

    render(<DocumentUpload {...mockProps} />)

    // Simulate file drop
    await waitFor(() => {
      onDropCallback([largeFile])
    })

    expect(mockProps.onUploadError).toHaveBeenCalledWith('File size must be less than 10MB')
  })

  it('validates file type correctly', async () => {
    const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-executable' })

    let onDropCallback: (files: File[]) => void

    const { useDropzone } = require('react-dropzone')
    useDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false
      }
    })

    render(<DocumentUpload {...mockProps} />)

    await waitFor(() => {
      onDropCallback([invalidFile])
    })

    expect(mockProps.onUploadError).toHaveBeenCalledWith('File type not supported')
  })

  it('handles successful upload', async () => {
    const mockUser = { id: 'user-123' }
    const mockDocument = {
      id: 'doc-123',
      filename: 'test.pdf',
      file_path: 'client-documents/test-client-id/123-test.pdf',
      client_id: 'test-client-id'
    }

    // Mock Supabase responses
    const mockStorage = {
      upload: vi.fn().mockResolvedValue({
        data: { path: 'client-documents/test-client-id/123-test.pdf' },
        error: null
      }),
      remove: vi.fn()
    }

    const mockDatabase = {
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

    let onDropCallback: (files: File[]) => void

    const { useDropzone } = require('react-dropzone')
    useDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false
      }
    })

    render(<DocumentUpload {...mockProps} />)

    await waitFor(() => {
      onDropCallback([mockFile])
    })

    await waitFor(() => {
      expect(mockProps.onUploadComplete).toHaveBeenCalledWith(mockDocument)
    })

    expect(mockStorage.upload).toHaveBeenCalledWith(
      expect.stringContaining('client-documents/test-client-id/'),
      mockFile,
      { cacheControl: '3600', upsert: false }
    )
  })

  it('handles upload error and cleans up', async () => {
    const mockUser = { id: 'user-123' }
    const uploadError = new Error('Storage error')

    const mockStorage = {
      upload: vi.fn().mockResolvedValue({
        data: null,
        error: uploadError
      }),
      remove: vi.fn()
    }

    vi.mocked(supabase.storage.from).mockReturnValue(mockStorage as any)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    } as any)

    let onDropCallback: (files: File[]) => void

    const { useDropzone } = require('react-dropzone')
    useDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false
      }
    })

    render(<DocumentUpload {...mockProps} />)

    await waitFor(() => {
      onDropCallback([mockFile])
    })

    await waitFor(() => {
      expect(mockProps.onUploadError).toHaveBeenCalledWith('Upload failed: Storage error')
    })
  })

  it('handles database error and cleans up storage', async () => {
    const mockUser = { id: 'user-123' }
    const dbError = new Error('Database error')

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
            error: dbError
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

    let onDropCallback: (files: File[]) => void

    const { useDropzone } = require('react-dropzone')
    useDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false
      }
    })

    render(<DocumentUpload {...mockProps} />)

    await waitFor(() => {
      onDropCallback([mockFile])
    })

    await waitFor(() => {
      expect(mockProps.onUploadError).toHaveBeenCalledWith('Database error: Database error')
    })

    // Should clean up uploaded file
    expect(mockStorage.remove).toHaveBeenCalledWith(['test-path'])
  })

  it('shows upload progress', async () => {
    const mockUser = { id: 'user-123' }
    
    // Mock slow upload
    const mockStorage = {
      upload: vi.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: { path: 'test-path' },
            error: null
          }), 100)
        )
      )
    }

    const mockDatabase = {
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'doc-123', filename: 'test.pdf' },
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

    let onDropCallback: (files: File[]) => void

    const { useDropzone } = require('react-dropzone')
    useDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false
      }
    })

    render(<DocumentUpload {...mockProps} />)

    await waitFor(() => {
      onDropCallback([mockFile])
    })

    // Should show upload progress
    await waitFor(() => {
      expect(screen.getByText('Upload Progress')).toBeInTheDocument()
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })
  })
})