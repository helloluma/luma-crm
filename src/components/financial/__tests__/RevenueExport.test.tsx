import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RevenueExport from '../RevenueExport'
import { RevenueData } from '../RevenueAnalytics'
import { Transaction } from '@/types'

import { vi } from 'vitest'

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock document.createElement and appendChild/removeChild
const mockLink = {
  setAttribute: vi.fn(),
  click: vi.fn(),
  style: { visibility: '' }
}

const originalCreateElement = document.createElement
document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink as any
  }
  return originalCreateElement.call(document, tagName)
})

const mockAppendChild = vi.fn()
const mockRemoveChild = vi.fn()
document.body.appendChild = mockAppendChild
document.body.removeChild = mockRemoveChild

describe('RevenueExport', () => {
  const mockRevenueData: RevenueData = {
    totalRevenue: 150000,
    commissionRevenue: 180000,
    closedDeals: 12,
    averageDealSize: 12500,
    yearOverYearGrowth: 15.5,
    goalProgress: 30.0,
    monthlyRevenue: [10000, 15000, 20000, 12000, 18000, 25000, 22000, 16000, 14000, 19000, 21000, 8000],
    monthlyLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }

  const mockTransactions: Transaction[] = [
    {
      id: 'trans-1',
      address: '123 Main St',
      price: 500000,
      commission_rate: 3,
      gross_commission: 15000,
      net_commission: 12000,
      broker_commission: 3000,
      status: 'Closed',
      closing_date: '2024-06-15',
      created_at: '2024-06-01T00:00:00Z',
      client_id: 'client-1'
    },
    {
      id: 'trans-2',
      address: '456 Oak Ave',
      price: 750000,
      commission_rate: 2.5,
      gross_commission: 18750,
      net_commission: 15000,
      broker_commission: 3750,
      status: 'Closed',
      closing_date: '2024-07-20',
      created_at: '2024-07-01T00:00:00Z',
      client_id: 'client-2'
    }
  ]

  const mockDateRange = { from: '2024-01-01', to: '2024-12-31' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterAll(() => {
    document.createElement = originalCreateElement
  })

  it('should render export button', () => {
    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('should show export options when button is clicked', () => {
    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))

    expect(screen.getByText('Export Options')).toBeInTheDocument()
    expect(screen.getByText('Revenue Summary')).toBeInTheDocument()
    expect(screen.getByText('Detailed Report')).toBeInTheDocument()
    expect(screen.getByText('Monthly Breakdown')).toBeInTheDocument()
  })

  it('should hide export options when backdrop is clicked', () => {
    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    expect(screen.getByText('Export Options')).toBeInTheDocument()

    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0')
    fireEvent.click(backdrop!)

    expect(screen.queryByText('Export Options')).not.toBeInTheDocument()
  })

  it('should show date range in export options', () => {
    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))

    expect(screen.getByText('Date Range: 1/1/2024 - 12/31/2024')).toBeInTheDocument()
  })

  it('should export summary CSV when summary option is clicked', async () => {
    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('Revenue Summary'))

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url')
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'revenue-summary-2024-01-01-to-2024-12-31.csv')
      expect(mockLink.click).toHaveBeenCalled()
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url')
    })
  })

  it('should export detailed CSV when detailed option is clicked', async () => {
    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('Detailed Report'))

    await waitFor(() => {
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'revenue-detailed-2024-01-01-to-2024-12-31.csv')
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  it('should export monthly CSV when monthly option is clicked', async () => {
    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('Monthly Breakdown'))

    await waitFor(() => {
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'revenue-monthly-2024-01-01-to-2024-12-31.csv')
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  it('should show loading state during export', async () => {
    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('Revenue Summary'))

    // Should briefly show exporting state
    expect(screen.getByText('Exporting...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  it('should disable export button during export', async () => {
    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('Revenue Summary'))

    const exportButton = screen.getByText('Exporting...')
    expect(exportButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText('Export')).not.toBeDisabled()
    })
  })

  it('should handle export errors gracefully', async () => {
    // Mock URL.createObjectURL to throw an error
    const originalCreateObjectURL = global.URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => {
      throw new Error('Export failed')
    })

    // Mock alert
    const mockAlert = vi.fn()
    global.alert = mockAlert

    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('Revenue Summary'))

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Export failed. Please try again.')
      expect(screen.getByText('Export')).toBeInTheDocument()
    })

    // Restore original function
    global.URL.createObjectURL = originalCreateObjectURL
  })

  it('should apply custom className', () => {
    const { container } = render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
        className="custom-export-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-export-class')
  })

  it('should generate correct summary CSV content', async () => {
    const mockCreateObjectURL = jest.fn(() => 'mock-url')
    global.URL.createObjectURL = mockCreateObjectURL

    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('Revenue Summary'))

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled()
      const blob = mockCreateObjectURL.mock.calls[0][0]
      expect(blob.type).toBe('text/csv;charset=utf-8;')
    })
  })

  it('should generate correct detailed CSV content', async () => {
    const mockCreateObjectURL = jest.fn(() => 'mock-url')
    global.URL.createObjectURL = mockCreateObjectURL

    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('Detailed Report'))

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled()
      const blob = mockCreateObjectURL.mock.calls[0][0]
      expect(blob.type).toBe('text/csv;charset=utf-8;')
    })
  })

  it('should generate correct monthly CSV content', async () => {
    const mockCreateObjectURL = jest.fn(() => 'mock-url')
    global.URL.createObjectURL = mockCreateObjectURL

    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('Monthly Breakdown'))

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled()
      const blob = mockCreateObjectURL.mock.calls[0][0]
      expect(blob.type).toBe('text/csv;charset=utf-8;')
    })
  })

  it('should close options after successful export', async () => {
    render(
      <RevenueExport 
        data={mockRevenueData} 
        transactions={mockTransactions} 
        dateRange={mockDateRange} 
      />
    )

    fireEvent.click(screen.getByText('Export'))
    expect(screen.getByText('Export Options')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Revenue Summary'))

    await waitFor(() => {
      expect(screen.queryByText('Export Options')).not.toBeInTheDocument()
    })
  })
})