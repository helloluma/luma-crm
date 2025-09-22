import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CommissionCalculator from '../CommissionCalculator'
import * as useTransactionsModule from '@/hooks/useTransactions'

// Mock the hooks
vi.mock('@/hooks/useTransactions', () => ({
  useTransactionActions: vi.fn(),
}))

const mockCalculationResult = {
  price: 250000,
  commission_rate: 3.0,
  broker_split: 20,
  gross_commission: 7500,
  broker_commission: 1500,
  net_commission: 6000,
  breakdown: {
    price_formatted: '$250,000.00',
    gross_commission_formatted: '$7,500.00',
    broker_commission_formatted: '$1,500.00',
    net_commission_formatted: '$6,000.00',
    commission_rate_formatted: '3%',
    broker_split_formatted: '20%',
  },
}

describe('CommissionCalculator', () => {
  const mockUseTransactionActions = {
    calculateCommission: vi.fn(),
    isLoading: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTransactionsModule.useTransactionActions).mockReturnValue(mockUseTransactionActions)
    mockUseTransactionActions.calculateCommission.mockResolvedValue(mockCalculationResult)
  })

  it('should render commission calculator with default values', () => {
    render(<CommissionCalculator />)

    expect(screen.getByText('Commission Calculator')).toBeInTheDocument()
    expect(screen.getByLabelText('Sale Price')).toBeInTheDocument()
    expect(screen.getByLabelText('Commission Rate')).toBeInTheDocument()
    expect(screen.getByLabelText('Broker Split')).toBeInTheDocument()
  })

  it('should render with initial values', () => {
    render(
      <CommissionCalculator
        initialPrice={300000}
        initialCommissionRate={2.5}
        initialBrokerSplit={25}
      />
    )

    expect(screen.getByDisplayValue('300000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2.5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('25')).toBeInTheDocument()
  })

  it('should calculate commission when inputs change', async () => {
    render(<CommissionCalculator />)

    const priceInput = screen.getByLabelText('Sale Price')
    const rateInput = screen.getByLabelText('Commission Rate')

    fireEvent.change(priceInput, { target: { value: '250000' } })
    fireEvent.change(rateInput, { target: { value: '3.0' } })

    await waitFor(() => {
      expect(mockUseTransactionActions.calculateCommission).toHaveBeenCalledWith({
        price: 250000,
        commission_rate: 3.0,
        broker_split: 20,
      })
    })
  })

  it('should display calculation results', async () => {
    render(<CommissionCalculator initialPrice={250000} initialCommissionRate={3.0} />)

    await waitFor(() => {
      expect(screen.getByText('$7,500.00')).toBeInTheDocument()
      expect(screen.getByText('$1,500.00')).toBeInTheDocument()
      expect(screen.getByText('$6,000.00')).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    vi.mocked(useTransactionsModule.useTransactionActions).mockReturnValue({
      ...mockUseTransactionActions,
      isLoading: true,
    })

    render(<CommissionCalculator initialPrice={250000} initialCommissionRate={3.0} />)

    expect(screen.getByText('Calculating...')).toBeInTheDocument()
  })

  it('should display error message', () => {
    vi.mocked(useTransactionsModule.useTransactionActions).mockReturnValue({
      ...mockUseTransactionActions,
      error: 'Calculation failed',
    })

    render(<CommissionCalculator />)

    expect(screen.getByText('Calculation failed')).toBeInTheDocument()
  })

  it('should toggle detailed breakdown', async () => {
    render(<CommissionCalculator initialPrice={250000} initialCommissionRate={3.0} />)

    await waitFor(() => {
      expect(screen.getByText('Show detailed breakdown')).toBeInTheDocument()
    })

    const toggleButton = screen.getByText('Show detailed breakdown')
    fireEvent.click(toggleButton)

    expect(screen.getByText('Hide detailed breakdown')).toBeInTheDocument()
    expect(screen.getByText('Calculation Breakdown')).toBeInTheDocument()
  })

  it('should show detailed breakdown information', async () => {
    render(<CommissionCalculator initialPrice={250000} initialCommissionRate={3.0} />)

    await waitFor(() => {
      const toggleButton = screen.getByText('Show detailed breakdown')
      fireEvent.click(toggleButton)
    })

    expect(screen.getByText('Sale Price:')).toBeInTheDocument()
    expect(screen.getByText('Commission Rate:')).toBeInTheDocument()
    expect(screen.getByText('Gross Commission:')).toBeInTheDocument()
    expect(screen.getByText('Commission Distribution')).toBeInTheDocument()
  })

  it('should handle commission rate presets', async () => {
    render(<CommissionCalculator initialPrice={250000} />)

    const preset25Button = screen.getByText('2.5%')
    fireEvent.click(preset25Button)

    const rateInput = screen.getByLabelText('Commission Rate')
    expect(rateInput).toHaveValue(2.5)

    await waitFor(() => {
      expect(mockUseTransactionActions.calculateCommission).toHaveBeenCalledWith({
        price: 250000,
        commission_rate: 2.5,
        broker_split: 20,
      })
    })
  })

  it('should validate commission rate bounds', () => {
    render(<CommissionCalculator />)

    const rateInput = screen.getByLabelText('Commission Rate')
    
    // Test upper bound
    fireEvent.change(rateInput, { target: { value: '150' } })
    expect(rateInput).toHaveValue(100)

    // Test lower bound
    fireEvent.change(rateInput, { target: { value: '-10' } })
    expect(rateInput).toHaveValue(0)
  })

  it('should validate broker split bounds', () => {
    render(<CommissionCalculator />)

    const brokerSplitInput = screen.getByLabelText('Broker Split')
    
    // Test upper bound
    fireEvent.change(brokerSplitInput, { target: { value: '150' } })
    expect(brokerSplitInput).toHaveValue(100)

    // Test lower bound
    fireEvent.change(brokerSplitInput, { target: { value: '-10' } })
    expect(brokerSplitInput).toHaveValue(0)
  })

  it('should call onCalculationChange callback', async () => {
    const onCalculationChange = vi.fn()
    render(
      <CommissionCalculator
        initialPrice={250000}
        initialCommissionRate={3.0}
        onCalculationChange={onCalculationChange}
      />
    )

    await waitFor(() => {
      expect(onCalculationChange).toHaveBeenCalledWith(mockCalculationResult)
    })
  })

  it('should handle zero price gracefully', async () => {
    const onCalculationChange = vi.fn()
    render(<CommissionCalculator onCalculationChange={onCalculationChange} />)

    const priceInput = screen.getByLabelText('Sale Price')
    fireEvent.change(priceInput, { target: { value: '0' } })

    await waitFor(() => {
      expect(onCalculationChange).toHaveBeenCalledWith({
        price: 0,
        commission_rate: 3.0,
        broker_split: 20,
        gross_commission: 0,
        broker_commission: 0,
        net_commission: 0,
        breakdown: {
          price_formatted: '$0.00',
          gross_commission_formatted: '$0.00',
          broker_commission_formatted: '$0.00',
          net_commission_formatted: '$0.00',
          commission_rate_formatted: '0%',
          broker_split_formatted: '0%',
        },
      })
    })
  })

  it('should handle empty price input', () => {
    render(<CommissionCalculator />)

    const priceInput = screen.getByLabelText('Sale Price')
    fireEvent.change(priceInput, { target: { value: '' } })

    expect(priceInput).toHaveValue(null)
    expect(mockUseTransactionActions.calculateCommission).not.toHaveBeenCalled()
  })

  it('should format currency correctly', async () => {
    render(<CommissionCalculator initialPrice={1234567} initialCommissionRate={3.0} />)

    await waitFor(() => {
      // Should display formatted currency values
      expect(screen.getByText(/\$37,037\.01/)).toBeInTheDocument() // Gross commission
    })
  })

  it('should show commission distribution visualization', async () => {
    render(<CommissionCalculator initialPrice={250000} initialCommissionRate={3.0} initialBrokerSplit={30} />)

    await waitFor(() => {
      const toggleButton = screen.getByText('Show detailed breakdown')
      fireEvent.click(toggleButton)
    })

    expect(screen.getByText('Commission Distribution')).toBeInTheDocument()
    expect(screen.getByText('Your Share')).toBeInTheDocument()
    expect(screen.getByText('Broker Share')).toBeInTheDocument()
  })

  it('should handle calculation errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockUseTransactionActions.calculateCommission.mockRejectedValue(new Error('API Error'))

    render(<CommissionCalculator initialPrice={250000} initialCommissionRate={3.0} />)

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to calculate commission:', expect.any(Error))
    })

    consoleError.mockRestore()
  })

  it('should apply custom className', () => {
    const { container } = render(<CommissionCalculator className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should show helper text for broker split', () => {
    render(<CommissionCalculator />)

    expect(screen.getByText('Percentage of gross commission that goes to the broker')).toBeInTheDocument()
  })

  it('should highlight active preset button', () => {
    render(<CommissionCalculator initialCommissionRate={3.0} />)

    const preset30Button = screen.getByText('3.0%')
    expect(preset30Button).toHaveClass('bg-blue-100', 'border-blue-300', 'text-blue-800')
  })

  it('should update calculation when broker split changes', async () => {
    render(<CommissionCalculator initialPrice={250000} initialCommissionRate={3.0} />)

    const brokerSplitInput = screen.getByLabelText('Broker Split')
    fireEvent.change(brokerSplitInput, { target: { value: '25' } })

    await waitFor(() => {
      expect(mockUseTransactionActions.calculateCommission).toHaveBeenCalledWith({
        price: 250000,
        commission_rate: 3.0,
        broker_split: 25,
      })
    })
  })
})