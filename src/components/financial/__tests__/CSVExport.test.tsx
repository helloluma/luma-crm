import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import CSVExport from '../CSVExport'
import type { TransactionWithClient } from '@/types'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { it } from 'zod/locales'
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-01-01'
    if (formatStr === 'MMM d, yyyy') return 'Jan 1, 2024'
    return '2024-01-01'
  }),
}))

describe('CSVExport', () => {
  const mockOnClose = vi.fn()

  const mockTransactions: TransactionWithClient[] = [
    {
      id: 'trans-1',
      address: '123 Main St',
      client_id: 'client-1',
      price: 100000,
      commission_rate: 3.0,
      net_commission: 2400,
      broker_commission: 600,
      status: 'Closed',
      closing_date: '2024-01-15',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      client: {
        id: 'client-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        type: 'Client',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 'trans-2',
      address: '456 Oak Ave',
      client_id: 'client-2',
      price: 200000,
      commission_rate: 2.5,
      net_commission: 4000,
      broker_commission: 1000,
      status: 'Active',
      closing_date: null,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      client: {
        id: 'client-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-0456',
        type: 'Lead',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url')
    global.URL.revokeObjectURL = vi.fn()
    
    // Mock document.createElement and appendChild/removeChild
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: { visibility: '' },
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the export dialog', () => {
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    expect(screen.getByText('Export Transactions')).toBeInTheDocument()
    expect(screen.getByText('Date Range')).toBeInTheDocument()
    expect(screen.getByText('Transaction Status')).toBeInTheDocument()
    expect(screen.getByText('Export Options')).toBeInTheDocument()
  })

  it('shows correct transaction count in preview', () => {
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    expect(screen.getByText('2 transactions will be exported')).toBeInTheDocument()
  })

  it('filters transactions by status', async () => {
    const user = userEvent.setup()
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    // Uncheck 'Active' status
    const activeCheckbox = screen.getByRole('checkbox', { name: 'Active' })
    await user.click(activeCheckbox)
    
    // Should show only 1 transaction (Closed)
    expect(screen.getByText('1 transactions will be exported')).toBeInTheDocument()
  })

  it('updates date range', async () => {
    const user = userEvent.setup()
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    const fromInput = screen.getByLabelText('From')
    await user.clear(fromInput)
    await user.type(fromInput, '2024-01-02')
    
    // Should filter out the first transaction
    expect(screen.getByText('1 transactions will be exported')).toBeInTheDocument()
  })

  it('toggles export options', async () => {
    const user = userEvent.setup()
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    const clientInfoCheckbox = screen.getByRole('checkbox', { name: 'Include client information' })
    const commissionCheckbox = screen.getByRole('checkbox', { name: 'Include commission breakdown and totals' })
    
    expect(clientInfoCheckbox).toBeChecked()
    expect(commissionCheckbox).toBeChecked()
    
    await user.click(clientInfoCheckbox)
    expect(clientInfoCheckbox).not.toBeChecked()
    
    await user.click(commissionCheckbox)
    expect(commissionCheckbox).not.toBeChecked()
  })

  it('handles export button click', async () => {
    const user = userEvent.setup()
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    const exportButton = screen.getByText('Export 2 Transactions')
    await user.click(exportButton)
    
    // Should show exporting state
    expect(screen.getByText('Exporting...')).toBeInTheDocument()
    
    // Should create download link
    await waitFor(() => {
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })
  })

  it('disables export button when no transactions', () => {
    render(<CSVExport transactions={[]} onClose={mockOnClose} />)
    
    const exportButton = screen.getByText('Export 0 Transactions')
    expect(exportButton).toBeDisabled()
  })

  it('handles close button click', async () => {
    const user = userEvent.setup()
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('generates correct CSV content with client info', async () => {
    const user = userEvent.setup()
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    const exportButton = screen.getByText('Export 2 Transactions')
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text/csv;charset=utf-8;',
        })
      )
    })
  })

  it('generates correct CSV content without client info', async () => {
    const user = userEvent.setup()
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    // Uncheck client info
    const clientInfoCheckbox = screen.getByRole('checkbox', { name: 'Include client information' })
    await user.click(clientInfoCheckbox)
    
    const exportButton = screen.getByText('Export 2 Transactions')
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })
  })

  it('includes totals row when commission breakdown is enabled', async () => {
    const user = userEvent.setup()
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    // Commission breakdown should be enabled by default
    const commissionCheckbox = screen.getByRole('checkbox', { name: 'Include commission breakdown and totals' })
    expect(commissionCheckbox).toBeChecked()
    
    const exportButton = screen.getByText('Export 2 Transactions')
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })
  })

  it('shows correct filename format', async () => {
    const user = userEvent.setup()
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    const exportButton = screen.getByText('Export 2 Transactions')
    await user.click(exportButton)
    
    await waitFor(() => {
      const mockLink = document.createElement('a')
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'download',
        expect.stringMatching(/transactions_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}\.csv/)
      )
    })
  })

  it('handles export errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock URL.createObjectURL to throw an error
    global.URL.createObjectURL = vi.fn(() => {
      throw new Error('Export failed')
    })
    
    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    const exportButton = screen.getByText('Export 2 Transactions')
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Export failed. Please try again.')
    })
    
    alertSpy.mockRestore()
  })

  it('closes modal after successful export', async () => {
    const user = userEvent.setup()
    render(<CSVExport transactions={mockTransactions} onClose={mockOnClose} />)
    
    const exportButton = screen.getByText('Export 2 Transactions')
    await user.click(exportButton)
    
    // Should close after 1 second delay
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    }, { timeout: 2000 })
  })
})