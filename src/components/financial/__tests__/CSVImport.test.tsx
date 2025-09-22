import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import CSVImport from '../CSVImport'
import { useClients } from '@/hooks/useClients'

// Mock the useClients hook
vi.mock('@/hooks/useClients')
const mockUseClients = vi.mocked(useClients)

// Mock file reading
const mockFileReader = {
  readAsText: vi.fn(),
  result: '',
  onload: null as any,
  onerror: null as any,
}

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader),
})

describe('CSVImport', () => {
  const mockOnImport = vi.fn()
  const mockOnClose = vi.fn()

  const mockClients = [
    {
      id: 'client-1',
      name: 'John Doe',
      email: 'john@example.com',
      type: 'Client' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'client-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      type: 'Lead' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseClients.mockReturnValue({
      clients: mockClients,
      loading: false,
      error: null,
      createClient: vi.fn(),
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
      refreshClients: vi.fn(),
    })
  })

  it('renders the import dialog', () => {
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    expect(screen.getByText('Import Transactions from CSV')).toBeInTheDocument()
    expect(screen.getByText('Drop your CSV file here, or click to browse')).toBeInTheDocument()
  })

  it('handles file selection via click', async () => {
    const user = userEvent.setup()
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    const selectButton = screen.getByText('Select File')
    await user.click(selectButton)
    
    // File input should be triggered (hidden input)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
  })

  it('handles drag and drop file selection', async () => {
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    const dropZone = screen.getByText('Drop your CSV file here, or click to browse').closest('div')
    expect(dropZone).toBeInTheDocument()
    
    // Test drag enter
    fireEvent.dragEnter(dropZone!, {
      dataTransfer: {
        files: [new File(['test'], 'test.csv', { type: 'text/csv' })],
      },
    })
    
    // Should show active drag state
    expect(dropZone).toHaveClass('border-blue-400', 'bg-blue-50')
  })

  it('validates file type', async () => {
    const user = userEvent.setup()
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    await user.upload(fileInput, invalidFile)
    
    expect(alertSpy).toHaveBeenCalledWith('Please select a CSV file')
    alertSpy.mockRestore()
  })

  it('processes CSV data correctly', async () => {
    const user = userEvent.setup()
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    const csvContent = `ADDRESS,NAME,SOURCE,S,B,PRICE,COMM %,GROSS COMM.,NET COMM.,BROKER
123 Main St,John Doe,referral,seller,,$100000,3.0%,$3000,$2400,$600`
    
    const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(fileInput, csvFile)
    
    // Should show file selected
    expect(screen.getByText('test.csv')).toBeInTheDocument()
    
    // Click process button
    const processButton = screen.getByText('Process CSV')
    await user.click(processButton)
    
    // Should process the file
    await waitFor(() => {
      expect(screen.getByText(/Import Ready|Import Issues Found/)).toBeInTheDocument()
    })
  })

  it('handles CSV parsing errors', async () => {
    const user = userEvent.setup()
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    const invalidCsvContent = `ADDRESS,NAME,PRICE
123 Main St,John Doe,invalid-price`
    
    const csvFile = new File([invalidCsvContent], 'test.csv', { type: 'text/csv' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(fileInput, csvFile)
    
    const processButton = screen.getByText('Process CSV')
    await user.click(processButton)
    
    await waitFor(() => {
      expect(screen.getByText('Import Issues Found')).toBeInTheDocument()
    })
  })

  it('handles client not found errors', async () => {
    const user = userEvent.setup()
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    const csvContent = `ADDRESS,NAME,SOURCE,S,B,PRICE,COMM %
123 Main St,Unknown Client,referral,seller,,$100000,3.0%`
    
    const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(fileInput, csvFile)
    
    const processButton = screen.getByText('Process CSV')
    await user.click(processButton)
    
    await waitFor(() => {
      expect(screen.getByText('Import Issues Found')).toBeInTheDocument()
      expect(screen.getByText(/Client "Unknown Client" not found/)).toBeInTheDocument()
    })
  })

  it('calls onImport with valid data', async () => {
    const user = userEvent.setup()
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    const csvContent = `ADDRESS,NAME,SOURCE,S,B,PRICE,COMM %
123 Main St,John Doe,referral,seller,,$100000,3.0%`
    
    const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(fileInput, csvFile)
    
    const processButton = screen.getByText('Process CSV')
    await user.click(processButton)
    
    await waitFor(() => {
      expect(screen.getByText('Import Ready')).toBeInTheDocument()
    })
    
    const importButton = screen.getByText(/Import \d+ Transactions/)
    await user.click(importButton)
    
    expect(mockOnImport).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          address: '123 Main St',
          client_name: 'John Doe',
          client_id: 'client-1',
          price: 100000,
          commission_rate: 3.0,
        }),
      ])
    )
  })

  it('handles close button click', async () => {
    const user = userEvent.setup()
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows loading state during processing', async () => {
    const user = userEvent.setup()
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    const csvContent = `ADDRESS,NAME,PRICE
123 Main St,John Doe,$100000`
    
    const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(fileInput, csvFile)
    
    const processButton = screen.getByText('Process CSV')
    await user.click(processButton)
    
    // Should show processing state
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('allows starting over after processing', async () => {
    const user = userEvent.setup()
    render(<CSVImport onImport={mockOnImport} onClose={mockOnClose} />)
    
    const csvContent = `ADDRESS,NAME,PRICE
123 Main St,John Doe,$100000`
    
    const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    await user.upload(fileInput, csvFile)
    
    const processButton = screen.getByText('Process CSV')
    await user.click(processButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Import Ready|Import Issues Found/)).toBeInTheDocument()
    })
    
    const startOverButton = screen.getByText('Start Over')
    await user.click(startOverButton)
    
    // Should return to initial state
    expect(screen.getByText('Drop your CSV file here, or click to browse')).toBeInTheDocument()
  })
})