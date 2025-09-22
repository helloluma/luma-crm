'use client'

import React, { useState } from 'react'
import { Download, FileText, Calendar, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import type { Transaction, TransactionWithClient } from '@/types'

interface ExportOptions {
  dateRange: {
    from: string
    to: string
  }
  status: string[]
  includeClientInfo: boolean
  includeCommissionBreakdown: boolean
  format: 'csv' | 'excel'
}

interface CSVExportProps {
  transactions: TransactionWithClient[]
  onClose: () => void
}

export default function CSVExport({ transactions, onClose }: CSVExportProps) {
  const [options, setOptions] = useState<ExportOptions>({
    dateRange: {
      from: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd')
    },
    status: ['Active', 'Pending', 'Closed'],
    includeClientInfo: true,
    includeCommissionBreakdown: true,
    format: 'csv'
  })
  const [exporting, setExporting] = useState(false)

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.created_at)
    const fromDate = new Date(options.dateRange.from)
    const toDate = new Date(options.dateRange.to)
    
    return (
      transactionDate >= fromDate &&
      transactionDate <= toDate &&
      options.status.includes(transaction.status)
    )
  })

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return ''
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (rate: number): string => {
    return `${rate}%`
  }

  const generateCSVContent = (): string => {
    const headers = [
      'Address',
      'Status',
      'Price',
      'Commission Rate',
      'Gross Commission',
      'Net Commission',
      'Broker Commission',
      'Closing Date',
      'Created Date'
    ]

    if (options.includeClientInfo) {
      headers.splice(1, 0, 'Client Name', 'Client Email', 'Client Phone', 'Client Type')
    }

    const rows = filteredTransactions.map(transaction => {
      const grossCommission = transaction.price * (transaction.commission_rate / 100)
      
      const baseRow = [
        transaction.address,
        transaction.status,
        formatCurrency(transaction.price),
        formatPercentage(transaction.commission_rate),
        formatCurrency(grossCommission),
        formatCurrency(transaction.net_commission),
        formatCurrency(transaction.broker_commission),
        transaction.closing_date || '',
        format(new Date(transaction.created_at), 'yyyy-MM-dd')
      ]

      if (options.includeClientInfo) {
        baseRow.splice(1, 0, 
          transaction.client?.name || '',
          transaction.client?.email || '',
          transaction.client?.phone || '',
          transaction.client?.type || ''
        )
      }

      return baseRow
    })

    // Add summary row if commission breakdown is included
    if (options.includeCommissionBreakdown) {
      const totals = filteredTransactions.reduce((acc, transaction) => {
        const grossCommission = transaction.price * (transaction.commission_rate / 100)
        return {
          totalPrice: acc.totalPrice + transaction.price,
          totalGrossCommission: acc.totalGrossCommission + grossCommission,
          totalNetCommission: acc.totalNetCommission + (transaction.net_commission || 0),
          totalBrokerCommission: acc.totalBrokerCommission + (transaction.broker_commission || 0)
        }
      }, {
        totalPrice: 0,
        totalGrossCommission: 0,
        totalNetCommission: 0,
        totalBrokerCommission: 0
      })

      // Add empty row
      rows.push(new Array(headers.length).fill(''))
      
      // Add totals row
      const totalsRow = ['TOTALS', '', formatCurrency(totals.totalPrice)]
      
      if (options.includeClientInfo) {
        totalsRow.splice(1, 0, '', '', '', '')
      }
      
      totalsRow.push(
        '', // Commission rate (not applicable for totals)
        formatCurrency(totals.totalGrossCommission),
        formatCurrency(totals.totalNetCommission),
        formatCurrency(totals.totalBrokerCommission),
        '', // Closing date
        '' // Created date
      )
      
      rows.push(totalsRow)
    }

    // Convert to CSV format
    const csvContent = [headers, ...rows]
      .map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell)
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(',')
      )
      .join('\n')

    return csvContent
  }

  const handleExport = async () => {
    setExporting(true)
    
    try {
      const csvContent = generateCSVContent()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // Create download link
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      const filename = `transactions_${options.dateRange.from}_to_${options.dateRange.to}.csv`
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      // Close modal after successful export
      setTimeout(() => {
        onClose()
      }, 1000)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleStatusChange = (status: string, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      status: checked 
        ? [...prev.status, status]
        : prev.status.filter(s => s !== status)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Export Transactions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={options.dateRange.from}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, from: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={options.dateRange.to}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, to: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Filter className="w-4 h-4 inline mr-2" />
                Transaction Status
              </label>
              <div className="space-y-2">
                {['Active', 'Pending', 'Closed'].map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.status.includes(status)}
                      onChange={(e) => handleStatusChange(status, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeClientInfo}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      includeClientInfo: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include client information</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeCommissionBreakdown}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      includeCommissionBreakdown: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include commission breakdown and totals</span>
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Export Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <FileText className="w-4 h-4 inline mr-1" />
                  {filteredTransactions.length} transactions will be exported
                </p>
                <p>Date range: {format(new Date(options.dateRange.from), 'MMM d, yyyy')} - {format(new Date(options.dateRange.to), 'MMM d, yyyy')}</p>
                <p>Status: {options.status.join(', ')}</p>
                {options.includeClientInfo && <p>✓ Client information included</p>}
                {options.includeCommissionBreakdown && <p>✓ Commission breakdown included</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || filteredTransactions.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : `Export ${filteredTransactions.length} Transactions`}
          </button>
        </div>
      </div>
    </div>
  )
}