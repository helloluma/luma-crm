'use client'

import { useState, useEffect } from 'react'
import { Calculator, DollarSign, Percent, TrendingUp, Info } from 'lucide-react'
import { useTransactionActions } from '@/hooks/useTransactions'

interface CommissionCalculatorProps {
  initialPrice?: number
  initialCommissionRate?: number
  initialBrokerSplit?: number
  onCalculationChange?: (calculation: CommissionCalculation) => void
  className?: string
}

interface CommissionCalculation {
  price: number
  commission_rate: number
  broker_split: number
  gross_commission: number
  broker_commission: number
  net_commission: number
  breakdown: {
    price_formatted: string
    gross_commission_formatted: string
    broker_commission_formatted: string
    net_commission_formatted: string
    commission_rate_formatted: string
    broker_split_formatted: string
  }
}

export default function CommissionCalculator({
  initialPrice = 0,
  initialCommissionRate = 3.0,
  initialBrokerSplit = 20,
  onCalculationChange,
  className = '',
}: CommissionCalculatorProps) {
  const [price, setPrice] = useState(initialPrice)
  const [commissionRate, setCommissionRate] = useState(initialCommissionRate)
  const [brokerSplit, setBrokerSplit] = useState(initialBrokerSplit)
  const [calculation, setCalculation] = useState<CommissionCalculation | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const { calculateCommission, isLoading, error } = useTransactionActions()

  // Calculate commission whenever inputs change
  useEffect(() => {
    if (price > 0 && commissionRate >= 0) {
      const performCalculation = async () => {
        try {
          const result = await calculateCommission({
            price,
            commission_rate: commissionRate,
            broker_split: brokerSplit,
          })
          setCalculation(result)
          if (onCalculationChange) {
            onCalculationChange(result)
          }
        } catch (error) {
          console.error('Failed to calculate commission:', error)
        }
      }

      performCalculation()
    } else {
      setCalculation(null)
      if (onCalculationChange) {
        onCalculationChange({
          price,
          commission_rate: commissionRate,
          broker_split: brokerSplit,
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
      }
    }
  }, [price, commissionRate, brokerSplit, calculateCommission, onCalculationChange])

  const handlePriceChange = (value: string) => {
    const numericValue = parseFloat(value) || 0
    setPrice(numericValue)
  }

  const handleCommissionRateChange = (value: string) => {
    const numericValue = parseFloat(value) || 0
    setCommissionRate(Math.min(100, Math.max(0, numericValue)))
  }

  const handleBrokerSplitChange = (value: string) => {
    const numericValue = parseFloat(value) || 0
    setBrokerSplit(Math.min(100, Math.max(0, numericValue)))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value}%`
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Commission Calculator</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Calculate commission breakdown based on sale price and rates
        </p>
      </div>

      {/* Input Form */}
      <div className="p-6 space-y-6">
        {/* Sale Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Sale Price
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="price"
              type="number"
              min="0"
              step="1000"
              value={price || ''}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="Enter sale price"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Commission Rate */}
        <div>
          <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-2">
            Commission Rate
          </label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="commissionRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={commissionRate || ''}
              onChange={(e) => handleCommissionRateChange(e.target.value)}
              placeholder="Enter commission rate"
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
          </div>
        </div>

        {/* Broker Split */}
        <div>
          <label htmlFor="brokerSplit" className="block text-sm font-medium text-gray-700 mb-2">
            Broker Split
          </label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="brokerSplit"
              type="number"
              min="0"
              max="100"
              step="1"
              value={brokerSplit || ''}
              onChange={(e) => handleBrokerSplitChange(e.target.value)}
              placeholder="Enter broker split"
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Percentage of gross commission that goes to the broker
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Calculating...</span>
          </div>
        )}

        {/* Results */}
        {calculation && !isLoading && (
          <div className="space-y-4">
            {/* Quick Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Gross Commission</div>
                <div className="text-2xl font-bold text-blue-900">
                  {calculation.breakdown.gross_commission_formatted}
                </div>
                <div className="text-xs text-blue-600">
                  {calculation.breakdown.commission_rate_formatted} of sale price
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-red-800">Broker Commission</div>
                <div className="text-2xl font-bold text-red-900">
                  {calculation.breakdown.broker_commission_formatted}
                </div>
                <div className="text-xs text-red-600">
                  {calculation.breakdown.broker_split_formatted} of gross
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-800">Net Commission</div>
                <div className="text-2xl font-bold text-green-900">
                  {calculation.breakdown.net_commission_formatted}
                </div>
                <div className="text-xs text-green-600">
                  Your earnings
                </div>
              </div>
            </div>

            {/* Detailed Breakdown Toggle */}
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <Info className="w-4 h-4" />
              <span>{showBreakdown ? 'Hide' : 'Show'} detailed breakdown</span>
            </button>

            {/* Detailed Breakdown */}
            {showBreakdown && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-900">Calculation Breakdown</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sale Price:</span>
                    <span className="font-medium">{calculation.breakdown.price_formatted}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission Rate:</span>
                    <span className="font-medium">{calculation.breakdown.commission_rate_formatted}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Commission:</span>
                      <span className="font-medium">{calculation.breakdown.gross_commission_formatted}</span>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {calculation.breakdown.price_formatted} × {calculation.breakdown.commission_rate_formatted}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Broker Split ({calculation.breakdown.broker_split_formatted}):</span>
                    <span className="font-medium text-red-600">
                      -{calculation.breakdown.broker_commission_formatted}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Net Commission:</span>
                      <span className="text-green-600">{calculation.breakdown.net_commission_formatted}</span>
                    </div>
                  </div>
                </div>

                {/* Commission Structure Visualization */}
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-2">Commission Distribution</div>
                  <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${100 - brokerSplit}%` }}
                    >
                      {100 - brokerSplit}%
                    </div>
                    <div 
                      className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${brokerSplit}%` }}
                    >
                      {brokerSplit}%
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Your Share</span>
                    <span>Broker Share</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Presets */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Presets</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { rate: 2.5, label: '2.5%' },
              { rate: 3.0, label: '3.0%' },
              { rate: 3.5, label: '3.5%' },
              { rate: 4.0, label: '4.0%' },
            ].map((preset) => (
              <button
                key={preset.rate}
                onClick={() => setCommissionRate(preset.rate)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  commissionRate === preset.rate
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}