import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import CSVManager from '../CSVManager'
import type { TransactionWithClient, CSVTransaction } from '@/types'
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
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the child components
vi.mock('../CSVImport', () => ({
  default: ({ onImport, onClose }: any) => (
    <div data-testid="csv-import-modal">
      <button onClick={() => onImport([])}>Mock Import</button>
      <button onClick={onClose}>Close Import</button>
    </div>
  )
}))

vi.mock('../CSVExport', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="csv-export-modal">
      <button onClick={onClose}>Close Export</button>
    </div>
  )
}))

describe('CSVManager', () => {
  const mockOnImport = vi.fn()

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
        type: 'Lead',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 'trans-3',
      address: '789 Pine St',
      client_id: 'client-3',
      price: 150000,
      commission_rate: 2.0,
      net_commission: 2400,
      broker_commission: 600,
      status: 'Pending',
      closing_date: null,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
      client: {
        id: 'client-3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        type: 'Prospect',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the CSV manager interface', () => {
    render(<CSVManager transactions={mockTransactions} onImport={mockOnImport} />)
    
    expect(screen.getByText('CSV Import/Export')).toBeInTheDocument()
    expect(screen.getByText('Import transactions from CSV files or export your data for reporting')).toBeInTheDocument()
    expect(screen.getByText('Import Transactions')).toBeInTheDocument()
    expect(screen.getByText('Export Transactions')).toBeInTheDocument()
  })

  it('displays correct transaction statistics', () => {
    render(<CSVManager transactions={mockTransactions} onImport={mockOnImport} />)
    
    expect(screen.getByText('3')).toBeInTheDocument() // Total transactions
    expect(screen.getByText('Total Transactions')).toBeInTheDocument()
    
    expect(screen.getByText('1')).toBeInTheDocument() // Closed deals
    expect(screen.getByText('Closed Deals')).toBeInTheDocument()
    
    expect(screen.getByText('1')).toBeInTheDocument() // Active deals (one of the numbers)
    expect(screen.getByText('Active Deals')).toBeInTheDocument()
  })

  it('shows import requirements and format information', () => {
    render(<CSVManager transactions={mockTransactions} onImport={mockOnImport} />)
    
    expect(screen.getByText('CSV Format Requirements:')).toBeInTheDocument()
    expect(screen.getByText(/Must include ADDRESS, NAME, PRICE, and COMM % columns/)).toBeInTheDocument()
    expect(screen.getByText(/Clients must exist in the system before import/)).toBeInTheDocument()
    expect(screen.getByText(/Price format: \$123,456.00 or 123456/)).toBeInTheDocument()
    expect(screen.getByText(/Commission rate: 3.0% or 3.0/)).toBeInTheDocument()
  })

  it('shows export features information', () => {
    render(<CSVManager transactions={mockTransactions} onImport={mockOnImport} />)
    
    expect(screen.getByText('Export Features:')).toBeInTheDocument()
    expect(screen.getByText(/Filter by date range and status/)).toBeInTheDocument()
    expect(screen.getByText(/Include client information/)).toBeInTheDocument()
    expect(screen.getByText(/Commission breakdown and totals/)).toBeInTheDocument()
    expect(screen.getByText(/3 transactions available/)).toBeInTheDocument()
  })

  it('opens import modal when import button is clicked', async () => {
    const user = userEvent.setup()
    render(<CSVManager transactions={mockTransactions} onImport={mockOnImport} />)
    
    const importButton = screen.getByText('Import CSV')
    await user.click(importButton)
    
    expect(screen.getByTestId('csv-import-modal')).toBeInTheDocument()
  })

  it('opens export modal when export button is clicked', async () => {
    const user = userEvent.setup()
    render(<CSVManager transactions={mockTransactions} onImport={mockOnImport} />)
    
    const exportButton = screen.getByText('Export CSV')
    await user.click(exportButton)
    
    expect(screen.getByTestId('csv-export-modal')).toBeInTheDocument()
  })

  it('closes import modal when close is triggered', async () => {
    const user = userEvent.setup()
    render(<CSVManager transactions={mockTransactions} onImport={mockOnImport} />)
    
    // Open import modal
    const importButton = screen.getByText('Import CSV')
    await user.click(importButton)
    
    expect(screen.getByTestId('csv-import-modal')).toBeInTheDocument()
    
    // Close import modal
    const closeButton = screen.getByText('Close Import')
    await user.click(closeButton)
    
    expect(screen.queryByTestId('csv-import-modal')).not.toBeInTheDocument()
  })

  it('closes export modal when close is triggered', async () => {
    const user = userEvent.setup()
    render(<CSVManager transactions={mockTransactions} onImport={mockOnImport} />)
    
    // Open export modal
    const exportButton = screen.getByText('Export CSV')
    await user.click(exportButton)
    
    expect(screen.getByTestId('csv-export-modal')).toBeInTheDocument()
    
    // Close export modal
    const closeButton = screen.getByText('Close Export')
    await user.click(closeButton)
    
    expect(screen.queryByTestId('csv-export-modal')).not.toBeInTheDocument()
  })

  it('passes onImport function to import modal', async () => {
    const user = userEvent.setup()
    render(<CSVManager transactions={mockTransactions} onImport={mockOnImport} />)
    
    // Open import modal
    const importButton = screen.getByText('Import CSV')
    await user.click(importButton)
    
    // Trigger mock import
    const mockImportButton = screen.getByText('Mock Import')
    await user.click(mockImportButton)
    
    expect(mockOnImport).toHaveBeenCalledWith([])
  })

  it('disables export button when no transactions', () => {
    render(<CSVManager transactions={[]} onImport={mockOnImport} />)
    
    const exportButton = screen.getByText('Export CSV')
    expect(exportButton).toBeDisabled()
    
    // Should show 0 transactions available
    expect(screen.getByText('0 transactions available')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <CSVManager 
        transactions={mockTransactions} 
        onImport={mockOnImport} 
        className="custom-class" 
      />
    )
    
    const managerElement = container.querySelector('.custom-class')
    expect(managerElement).toBeInTheDocument()
  })

  it('calculates statistics correctly with empty transactions', () => {
    render(<CSVManager transactions={[]} onImport={mockOnImport} />)
    
    // All stats should be 0
    const statsElements = screen.getAllByText('0')
    expect(statsElements).toHaveLength(3) // Total, Closed, Active
  })

  it('calculates statistics correctly with mixed statuses', () => {
    const mixedTransactions = [
      ...mockTransactions,
      {
        id: 'trans-4',
        address: '999 Test St',
        client_id: 'client-4',
        price: 300000,
        commission_rate: 3.5,
        net_commission: 8400,
        broker_commission: 2100,
        status: 'Closed' as const,
        closing_date: '2024-01-20',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
        client: {
          id: 'client-4',
          name: 'Alice Brown',
          email: 'alice@example.com',
          type: 'Client' as const,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      },
    ]
    
    render(<CSVManager transactions={mixedTransactions} onImport={mockOnImport} />)
    
    expect(screen.getByText('4')).toBeInTheDocument() // Total transactions
    expect(screen.getByText('2')).toBeInTheDocument() // Closed deals (2 closed)
    expect(screen.getByText('1')).toBeInTheDocument() // Active deals (1 active)
  })
})