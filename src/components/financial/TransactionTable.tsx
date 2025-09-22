'use client'

import { useState, useMemo } from 'react'
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  MapPin,
  User,
  CheckSquare,
  Square
} from 'lucide-react'
import { useTransactions, useTransactionActions } from '@/hooks/useTransactions'
import type { Transaction, TransactionStatus, TransactionFilters } from '@/types'

interface TransactionTableProps {
  clientId?: string
  onTransactionSelect?: (transaction: Transaction) => void
  onTransactionEdit?: (transaction: Transaction) => void
  onTransactionDelete?: (transaction: Transaction) => void
}

export default function TransactionTable({
  clientId,
  onTransactionSelect,
  onTransactionEdit,
  onTransactionDelete,
}: TransactionTableProps) {
  const [filters, setFilters] = useState<Partial<TransactionFilters>>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    client_id: clientId,
  })
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const { transactions, count, totalPages, isLoading, error, mutate } = useTransactions({
    filters,
  })
  const { deleteTransaction, isLoading: isDeleting } = useTransactionActions()

  // Handle sorting
  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  // Handle search
  const handleSearch = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search: search || undefined,
      page: 1,
    }))
  }

  // Handle status filter
  const handleStatusFilter = (status: TransactionStatus[]) => {
    setFilters(prev => ({
      ...prev,
      status: status.length > 0 ? status : undefined,
      page: 1,
    }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // Handle selection
  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedTransactions(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)))
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTransactions.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedTransactions.size} transaction(s)?`)) {
      return
    }

    try {
      await Promise.all(
        Array.from(selectedTransactions).map(id => deleteTransaction(id))
      )
      setSelectedTransactions(new Set())
      mutate()
    } catch (error) {
      console.error('Failed to delete transactions:', error)
    }
  }

  // Handle individual delete
  const handleDelete = async (transaction: Transaction) => {
    if (!confirm(`Are you sure you want to delete the transaction for ${transaction.address}?`)) {
      return
    }

    try {
      await deleteTransaction(transaction.id)
      mutate()
      if (onTransactionDelete) {
        onTransactionDelete(transaction)
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error)
    }
  }

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  // Get status badge color
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Closed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate gross commission
  const calculateGrossCommission = (price: number, commissionRate: number) => {
    return (price * commissionRate) / 100
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (filters.sort_by !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />
    }
    return filters.sort_order === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-gray-600" /> : 
      <ChevronDown className="w-4 h-4 text-gray-600" />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load transactions: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
          <div className="flex items-center space-x-2">
            {selectedTransactions.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50"
              >
                Delete Selected ({selectedTransactions.size})
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search transactions by address..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  multiple
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value) as TransactionStatus[]
                    handleStatusFilter(values)
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    price_min: e.target.value ? Number(e.target.value) : undefined,
                    page: 1,
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="1000000"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    price_max: e.target.value ? Number(e.target.value) : undefined,
                    page: 1,
                  }))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={handleSelectAll}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {selectedTransactions.size === transactions.length && transactions.length > 0 ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('address')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Address</span>
                  <SortIcon field="address" />
                </button>
              </th>
              {!clientId && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>Client</span>
                  </div>
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('price')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Price</span>
                  <SortIcon field="price" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <span>Status</span>
                  <SortIcon field="status" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('closing_date')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Closing Date</span>
                  <SortIcon field="closing_date" />
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={clientId ? 6 : 7} className="px-6 py-12 text-center text-gray-500">
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={clientId ? 6 : 7} className="px-6 py-12 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onTransactionSelect?.(transaction)}
                >
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectTransaction(transaction.id)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {selectedTransactions.has(transaction.id) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.address}
                    </div>
                  </td>
                  {!clientId && (
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {(transaction as any).client?.name || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(transaction as any).client?.email || ''}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div>Rate: {transaction.commission_rate}%</div>
                      <div>Gross: {formatCurrency(calculateGrossCommission(transaction.price, transaction.commission_rate))}</div>
                      <div>Net: {formatCurrency(transaction.net_commission)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(transaction.closing_date)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onTransactionSelect?.(transaction)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onTransactionEdit?.(transaction)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(transaction)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((filters.page || 1) - 1) * (filters.limit || 10) + 1} to{' '}
              {Math.min((filters.page || 1) * (filters.limit || 10), count)} of {count} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange((filters.page || 1) - 1)}
                disabled={filters.page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {filters.page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange((filters.page || 1) + 1)}
                disabled={filters.page === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}