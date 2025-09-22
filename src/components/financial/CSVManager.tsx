'use client'

import React, { useState } from 'react'
import { Upload, Download, FileText, AlertCircle } from 'lucide-react'
import CSVImport from './CSVImport'
import CSVExport from './CSVExport'
import type { TransactionWithClient, CSVTransaction } from '@/types'

interface CSVManagerProps {
  transactions: TransactionWithClient[]
  onImport: (data: CSVTransaction[]) => Promise<void>
  className?: string
}

export default function CSVManager({ transactions, onImport, className = '' }: CSVManagerProps) {
  const [showImport, setShowImport] = useState(false)
  const [showExport, setShowExport] = useState(false)

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">CSV Import/Export</h3>
            <p className="text-sm text-gray-600 mt-1">
              Import transactions from CSV files or export your data for reporting
            </p>
          </div>
          <FileText className="w-8 h-8 text-blue-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Import Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Import Transactions</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file to import multiple transactions at once. The system will validate data and match clients automatically.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">CSV Format Requirements:</p>
                  <ul className="space-y-1">
                    <li>• Must include ADDRESS, NAME, PRICE, and COMM % columns</li>
                    <li>• Clients must exist in the system before import</li>
                    <li>• Price format: $123,456.00 or 123456</li>
                    <li>• Commission rate: 3.0% or 3.0</li>
                  </ul>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowImport(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          </div>

          {/* Export Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Download className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Export Transactions</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Export your transaction data to CSV format for reporting, backup, or analysis in external tools.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <div className="text-xs text-gray-700">
                <p className="font-medium mb-1">Export Features:</p>
                <ul className="space-y-1">
                  <li>• Filter by date range and status</li>
                  <li>• Include client information</li>
                  <li>• Commission breakdown and totals</li>
                  <li>• {transactions.length} transactions available</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowExport(true)}
              disabled={transactions.length === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {transactions.filter(t => t.status === 'Closed').length}
              </div>
              <div className="text-sm text-gray-600">Closed Deals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {transactions.filter(t => t.status === 'Active').length}
              </div>
              <div className="text-sm text-gray-600">Active Deals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <CSVImport
          onImport={onImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Export Modal */}
      {showExport && (
        <CSVExport
          transactions={transactions}
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  )
}