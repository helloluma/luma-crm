import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { DocumentManager } from '../DocumentManager'

// Mock child components
vi.mock('../DocumentUpload', () => ({
  DocumentUpload: ({ onUploadComplete, onUploadError }: any) => (
    <div data-testid="document-upload">
      <button 
        onClick={() => onUploadComplete({ 
          id: 'new-doc', 
          filename: 'test.pdf',
          client_id: 'client-1'
        })}
      >
        Mock Upload Success
      </button>
      <button onClick={() => onUploadError('Upload failed')}>
        Mock Upload Error
      </button>
    </div>
  )
}))

vi.mock('../DocumentList', () => ({
  DocumentList: ({ onDocumentDeleted, onDocumentError }: any) => (
    <div data-testid="document-list">
      <button onClick={() => onDocumentDeleted('doc-1')}>
        Mock Delete Success
      </button>
      <button onClick={() => onDocumentError('Delete failed')}>
        Mock Delete Error
      </button>
    </div>
  )
}))

describe('DocumentManager', () => {
  const mockProps = {
    clientId: 'client-1',
    clientName: 'John Doe'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders header with client name', () => {
    render(<DocumentManager {...mockProps} />)
    
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('for John Doe')).toBeInTheDocument()
    expect(screen.getByText('Upload Document')).toBeInTheDocument()
  })

  it('renders header without client name when not provided', () => {
    render(<DocumentManager clientId="client-1" />)
    
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.queryByText(/for /)).not.toBeInTheDocument()
  })

  it('toggles upload section when upload button is clicked', () => {
    render(<DocumentManager {...mockProps} />)
    
    // Upload section should not be visible initially
    expect(screen.queryByTestId('document-upload')).not.toBeInTheDocument()
    
    // Click upload button
    fireEvent.click(screen.getByText('Upload Document'))
    
    // Upload section should now be visible
    expect(screen.getByTestId('document-upload')).toBeInTheDocument()
    expect(screen.getByText('Upload New Document')).toBeInTheDocument()
    
    // Click upload button again to hide
    fireEvent.click(screen.getByText('Upload Document'))
    
    // Upload section should be hidden again
    expect(screen.queryByTestId('document-upload')).not.toBeInTheDocument()
  })

  it('handles successful upload', async () => {
    render(<DocumentManager {...mockProps} />)
    
    // Show upload section
    fireEvent.click(screen.getByText('Upload Document'))
    
    // Trigger successful upload
    fireEvent.click(screen.getByText('Mock Upload Success'))
    
    // Should show success notification
    await waitFor(() => {
      expect(screen.getByText('"test.pdf" uploaded successfully')).toBeInTheDocument()
    })
    
    // Upload section should be hidden
    expect(screen.queryByTestId('document-upload')).not.toBeInTheDocument()
    
    // Notification should disappear after 3 seconds
    vi.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(screen.queryByText('"test.pdf" uploaded successfully')).not.toBeInTheDocument()
    })
  })

  it('handles upload error', async () => {
    render(<DocumentManager {...mockProps} />)
    
    // Show upload section
    fireEvent.click(screen.getByText('Upload Document'))
    
    // Trigger upload error
    fireEvent.click(screen.getByText('Mock Upload Error'))
    
    // Should show error notification
    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })
    
    // Upload section should still be visible
    expect(screen.getByTestId('document-upload')).toBeInTheDocument()
    
    // Error notification should disappear after 5 seconds
    vi.advanceTimersByTime(5000)
    
    await waitFor(() => {
      expect(screen.queryByText('Upload failed')).not.toBeInTheDocument()
    })
  })

  it('handles successful document deletion', async () => {
    render(<DocumentManager {...mockProps} />)
    
    // Trigger successful deletion
    fireEvent.click(screen.getByText('Mock Delete Success'))
    
    // Should show success notification
    await waitFor(() => {
      expect(screen.getByText('Document deleted successfully')).toBeInTheDocument()
    })
    
    // Notification should disappear after 3 seconds
    vi.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(screen.queryByText('Document deleted successfully')).not.toBeInTheDocument()
    })
  })

  it('handles document deletion error', async () => {
    render(<DocumentManager {...mockProps} />)
    
    // Trigger deletion error
    fireEvent.click(screen.getByText('Mock Delete Error'))
    
    // Should show error notification
    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument()
    })
    
    // Error notification should disappear after 5 seconds
    vi.advanceTimersByTime(5000)
    
    await waitFor(() => {
      expect(screen.queryByText('Delete failed')).not.toBeInTheDocument()
    })
  })

  it('allows manual notification dismissal', async () => {
    render(<DocumentManager {...mockProps} />)
    
    // Show upload section and trigger error
    fireEvent.click(screen.getByText('Upload Document'))
    fireEvent.click(screen.getByText('Mock Upload Error'))
    
    // Should show error notification
    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })
    
    // Click dismiss button
    fireEvent.click(screen.getByText('×'))
    
    // Notification should disappear immediately
    expect(screen.queryByText('Upload failed')).not.toBeInTheDocument()
  })

  it('shows success notification with correct styling', async () => {
    render(<DocumentManager {...mockProps} />)
    
    // Show upload section and trigger success
    fireEvent.click(screen.getByText('Upload Document'))
    fireEvent.click(screen.getByText('Mock Upload Success'))
    
    await waitFor(() => {
      const notification = screen.getByText('"test.pdf" uploaded successfully').closest('div')
      expect(notification).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800')
    })
  })

  it('shows error notification with correct styling', async () => {
    render(<DocumentManager {...mockProps} />)
    
    // Show upload section and trigger error
    fireEvent.click(screen.getByText('Upload Document'))
    fireEvent.click(screen.getByText('Mock Upload Error'))
    
    await waitFor(() => {
      const notification = screen.getByText('Upload failed').closest('div')
      expect(notification).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800')
    })
  })

  it('renders document list component', () => {
    render(<DocumentManager {...mockProps} />)
    
    expect(screen.getByTestId('document-list')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <DocumentManager {...mockProps} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})