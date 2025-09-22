'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { csvTransactionSchema, type CSVTransaction } from '@/lib/validations/transaction'
import { useClients } from '@/hooks/useClients'

interface ImportError {
  row: number
  field: string
  message: string
  value: string
}

interface ImportResult {
  success: boolean
  imported: number
  errors: ImportError[]
  data?: CSVTransaction[]
}

interface CSVImportProps {
  onImport: (data: CSVTransaction[]) => Promise<void>
  onClose: () => void
}

export default function CSVImport({ onImport, onClose }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { clients } = useClients()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }
    setFile(selectedFile)
    setResult(null)
  }

  const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.split('\n')
    const result: string[][] = []
    
    for (const line of lines) {
      if (line.trim() === '') continue
      
      const row: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      row.push(current.trim())
      result.push(row)
    }
    
    return result
  }

  const findClientByName = (name: string): string | null => {
    if (!clients || !name) return null
    
    const normalizedName = name.toLowerCase().trim()
    const client = clients.find(c => 
      c.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(c.name.toLowerCase())
    )
    
    return client?.id || null
  }

  const processCSVData = async () => {
    if (!file) return

    setImporting(true)
    const errors: ImportError[] = []
    const validData: CSVTransaction[] = []

    try {
      const text = await file.text()
      const rows = parseCSV(text)
      
      if (rows.length === 0) {
        setResult({ success: false, imported: 0, errors: [{ row: 0, field: 'file', message: 'CSV file is empty', value: '' }] })
        return
      }

      // Find header row and data rows based on CSV structure
      let headerRowIndex = -1
      let dataStartIndex = -1
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (row.some(cell => cell.toLowerCase().includes('address'))) {
          headerRowIndex = i
          dataStartIndex = i + 1
          break
        }
      }

      if (headerRowIndex === -1) {
        setResult({ success: false, imported: 0, errors: [{ row: 0, field: 'headers', message: 'Could not find header row with ADDRESS column', value: '' }] })
        return
      }

      const headers = rows[headerRowIndex].map(h => h.toLowerCase().trim())
      
      // Map CSV columns to our schema
      const columnMapping = {
        address: headers.findIndex(h => h.includes('address')),
        name: headers.findIndex(h => h.includes('name')),
        source: headers.findIndex(h => h.includes('source')),
        side: headers.findIndex(h => h === 's' || h.includes('side')),
        price: headers.findIndex(h => h.includes('price')),
        commission_rate: headers.findIndex(h => h.includes('comm') && h.includes('%')),
        gross_commission: headers.findIndex(h => h.includes('gross') && h.includes('comm')),
        net_commission: headers.findIndex(h => h.includes('net') && h.includes('comm')),
        broker_commission: headers.findIndex(h => h.includes('broker')),
        closing_date: headers.findIndex(h => h.includes('closing') || h.includes('date')),
      }

      // Process data rows
      for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i]
        
        // Skip empty rows or summary rows
        if (row.every(cell => !cell || cell.trim() === '') || 
            row[0]?.toLowerCase().includes('total') ||
            row[0]?.toLowerCase().includes('pending:') ||
            row[0]?.toLowerCase().includes('sold:')) {
          continue
        }

        try {
          const rawData = {
            address: columnMapping.address >= 0 ? row[columnMapping.address] || '' : '',
            client_name: columnMapping.name >= 0 ? row[columnMapping.name] || '' : '',
            source: columnMapping.source >= 0 ? row[columnMapping.source] || '' : '',
            side: columnMapping.side >= 0 ? row[columnMapping.side] || '' : '',
            price: columnMapping.price >= 0 ? row[columnMapping.price] || '0' : '0',
            commission_rate: columnMapping.commission_rate >= 0 ? row[columnMapping.commission_rate] || '0' : '0',
            gross_commission: columnMapping.gross_commission >= 0 ? row[columnMapping.gross_commission] || '' : '',
            net_commission: columnMapping.net_commission >= 0 ? row[columnMapping.net_commission] || '' : '',
            broker_commission: columnMapping.broker_commission >= 0 ? row[columnMapping.broker_commission] || '' : '',
            closing_date: columnMapping.closing_date >= 0 ? row[columnMapping.closing_date] || '' : '',
          }

          // Skip rows with no address or price
          if (!rawData.address || !rawData.price || rawData.price === '0' || rawData.price === '$0.00') {
            continue
          }

          const validatedData = csvTransactionSchema.parse(rawData)
          
          // Try to find matching client
          const clientId = findClientByName(validatedData.client_name)
          if (!clientId) {
            errors.push({
              row: i + 1,
              field: 'client_name',
              message: `Client "${validatedData.client_name}" not found. Please create the client first.`,
              value: validatedData.client_name
            })
            continue
          }

          validData.push({
            ...validatedData,
            client_id: clientId
          })

        } catch (error: any) {
          if (error.errors) {
            // Zod validation errors
            error.errors.forEach((err: any) => {
              errors.push({
                row: i + 1,
                field: err.path.join('.'),
                message: err.message,
                value: row[columnMapping[err.path[0] as keyof typeof columnMapping]] || ''
              })
            })
          } else {
            errors.push({
              row: i + 1,
              field: 'general',
              message: error.message || 'Unknown error processing row',
              value: row.join(', ')
            })
          }
        }
      }

      setResult({
        success: errors.length === 0,
        imported: validData.length,
        errors,
        data: validData
      })

    } catch (error: any) {
      setResult({
        success: false,
        imported: 0,
        errors: [{ row: 0, field: 'file', message: error.message || 'Failed to process CSV file', value: '' }]
      })
    } finally {
      setImporting(false)
    }
  }

  const handleImport = async () => {
    if (!result?.data) return
    
    try {
      await onImport(result.data)
      onClose()
    } catch (error: any) {
      alert(`Import failed: ${error.message}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Import Transactions from CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!file && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports CSV files with transaction data
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Select File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}

          {file && !result && (
            <div className="text-center">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">{file.name}</p>
              <p className="text-sm text-gray-500 mb-4">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={processCSVData}
                  disabled={importing}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {importing ? 'Processing...' : 'Process CSV'}
                </button>
                <button
                  onClick={() => setFile(null)}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Choose Different File
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {result.success ? 'Import Ready' : 'Import Issues Found'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {result.imported} transactions ready to import
                    {result.errors.length > 0 && `, ${result.errors.length} errors found`}
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-3">Import Errors:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium text-red-800">Row {error.row}:</span>
                        <span className="text-red-700 ml-2">
                          {error.field} - {error.message}
                        </span>
                        {error.value && (
                          <span className="text-red-600 ml-2">
                            (Value: "{error.value}")
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setFile(null)
                    setResult(null)
                  }}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Start Over
                </button>
                {result.imported > 0 && (
                  <button
                    onClick={handleImport}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Import {result.imported} Transactions
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}