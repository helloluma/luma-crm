'use client'

import React, { useState } from 'react'
import { RevenueData } from './RevenueAnalytics'
import { Transaction } from '@/types'
import { Download, FileText, Table, BarChart3 } from 'lucide-react'

interface RevenueExportProps {
  data: RevenueData
  transactions: Transaction[]
  dateRange: { from: string; to: string }
  className?: string
}

export const RevenueExport: React.FC<RevenueExportProps> = ({ 
  data, 
  transactions, 
  dateRange, 
  className = '' 
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const exportOptions = [
    {
      id: 'summary',
      label: 'Revenue Summary',
      description: 'Key metrics and totals',
      icon: BarChart3,
      format: 'CSV'
    },
    {
      id: 'detailed',
      label: 'Detailed Report',
      description: 'All transactions with calculations',
      icon: Table,
      format: 'CSV'
    },
    {
      id: 'monthly',
      label: 'Monthly Breakdown',
      description: 'Month-by-month analysis',
      icon: FileText,
      format: 'CSV'
    }
  ]

  const handleExport = async (type: string) => {
    setIsExporting(true)
    setShowOptions(false)

    try {
      let csvContent = ''
      let filename = ''

      switch (type) {
        case 'summary':
          csvContent = generateSummaryCSV(data, dateRange)
          filename = `revenue-summary-${dateRange.from}-to-${dateRange.to}.csv`
          break
        case 'detailed':
          csvContent = generateDetailedCSV(transactions, dateRange)
          filename = `revenue-detailed-${dateRange.from}-to-${dateRange.to}.csv`
          break
        case 'monthly':
          csvContent = generateMonthlyCSV(data, dateRange)
          filename = `revenue-monthly-${dateRange.from}-to-${dateRange.to}.csv`
          break
        default:
          throw new Error('Invalid export type')
      }

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {showOptions && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Export Options</h3>
            
            <div className="space-y-2">
              {exportOptions.map((option) => {
                const Icon = option.icon
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleExport(option.id)}
                    className="w-full flex items-start gap-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{option.label}</h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {option.format}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Date Range: {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close options */}
      {showOptions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  )
}

// Helper function to generate summary CSV
function generateSummaryCSV(data: RevenueData, dateRange: { from: string; to: string }): string {
  const headers = ['Metric', 'Value', 'Period']
  const rows = [
    ['Total Revenue', `$${data.totalRevenue.toLocaleString()}`, `${dateRange.from} to ${dateRange.to}`],
    ['Gross Commission', `$${data.commissionRevenue.toLocaleString()}`, `${dateRange.from} to ${dateRange.to}`],
    ['Closed Deals', data.closedDeals.toString(), `${dateRange.from} to ${dateRange.to}`],
    ['Average Deal Size', `$${data.averageDealSize.toLocaleString()}`, `${dateRange.from} to ${dateRange.to}`],
    ['Year-over-Year Growth', `${data.yearOverYearGrowth.toFixed(2)}%`, `${dateRange.from} to ${dateRange.to}`],
    ['Goal Progress', `${data.goalProgress.toFixed(2)}%`, `${dateRange.from} to ${dateRange.to}`]
  ]

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Helper function to generate detailed CSV
function generateDetailedCSV(transactions: Transaction[], dateRange: { from: string; to: string }): string {
  const headers = [
    'Transaction ID',
    'Address',
    'Client ID',
    'Price',
    'Commission Rate (%)',
    'Gross Commission',
    'Net Commission',
    'Broker Commission',
    'Status',
    'Closing Date',
    'Created Date'
  ]

  const rows = transactions.map(transaction => [
    transaction.id,
    `"${transaction.address}"`, // Wrap in quotes to handle commas
    transaction.client_id || '',
    transaction.price.toString(),
    transaction.commission_rate.toString(),
    (transaction.gross_commission || 0).toString(),
    (transaction.net_commission || 0).toString(),
    (transaction.broker_commission || 0).toString(),
    transaction.status,
    transaction.closing_date || '',
    transaction.created_at
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Helper function to generate monthly CSV
function generateMonthlyCSV(data: RevenueData, dateRange: { from: string; to: string }): string {
  const headers = ['Month', 'Revenue', 'Period']
  
  const rows = data.monthlyLabels.map((month, index) => [
    month,
    `$${data.monthlyRevenue[index].toLocaleString()}`,
    `${dateRange.from} to ${dateRange.to}`
  ])

  // Add summary row
  rows.push(['Total', `$${data.totalRevenue.toLocaleString()}`, `${dateRange.from} to ${dateRange.to}`])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export default RevenueExport