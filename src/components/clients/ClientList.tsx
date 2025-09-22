'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, SortAsc, SortDesc, Grid, List, Plus, RefreshCw } from 'lucide-react'
import { ClientCard } from './ClientCard'
import { useClients } from '@/hooks/useClients'
import type { ClientWithAgent, ClientFilters, ClientType } from '@/types'

interface ClientListProps {
  onClientEdit?: (client: ClientWithAgent) => void
  onClientDelete?: (client: ClientWithAgent) => void
  onClientView?: (client: ClientWithAgent) => void
  onClientCreate?: () => void
  className?: string
}

type SortField = 'name' | 'email' | 'type' | 'created_at' | 'last_contact'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

const CLIENT_TYPES: ClientType[] = ['Lead', 'Prospect', 'Client', 'Closed']

export function ClientList({
  onClientEdit,
  onClientDelete,
  onClientView,
  onClientCreate,
  className
}: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedTypes, setSelectedTypes] = useState<ClientType[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])

  // Build filters object
  const filters: ClientFilters = useMemo(() => ({
    search: searchTerm.trim() || undefined,
    type: selectedTypes.length > 0 ? selectedTypes : undefined,
    source: selectedSources.length > 0 ? selectedSources : undefined
  }), [searchTerm, selectedTypes, selectedSources])

  const {
    clients,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    setPage,
    setFilters,
    clearFilters,
    refetch
  } = useClients({
    filters,
    limit: 12
  })

  // Update filters when they change
  React.useEffect(() => {
    setFilters(filters)
  }, [filters, setFilters])

  // Sort clients locally (since API doesn't support all sort options yet)
  const sortedClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle null values
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return 1
      if (bValue === null) return -1

      // Convert to comparable values
      if (sortField === 'created_at' || sortField === 'last_contact') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [clients, sortField, sortDirection])

  // Get unique sources for filter dropdown
  const availableSources = useMemo(() => {
    const sources = clients
      .map(client => client.source)
      .filter((source): source is string => Boolean(source))
    return Array.from(new Set(sources)).sort()
  }, [clients])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleTypeFilter = (type: ClientType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleSourceFilter = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedTypes([])
    setSelectedSources([])
    clearFilters()
  }

  const hasActiveFilters = searchTerm || selectedTypes.length > 0 || selectedSources.length > 0

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            {totalCount} {totalCount === 1 ? 'client' : 'clients'} total
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {onClientCreate && (
            <button
              onClick={onClientCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-gray-300 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-md transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                {(selectedTypes.length + selectedSources.length + (searchTerm ? 1 : 0))}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Client Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Type
                </label>
                <div className="space-y-2">
                  {CLIENT_TYPES.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeFilter(type)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Source Filter */}
              {availableSources.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableSources.map(source => (
                      <label key={source} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source)}
                          onChange={() => handleSourceFilter(source)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{source}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-gray-600">Sort by:</span>
        <div className="flex items-center gap-2">
          {[
            { field: 'name' as SortField, label: 'Name' },
            { field: 'type' as SortField, label: 'Type' },
            { field: 'created_at' as SortField, label: 'Created' },
            { field: 'last_contact' as SortField, label: 'Last Contact' }
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                sortField === field
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
              {sortField === field && (
                sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading clients...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">
            <strong>Error:</strong> {error}
          </div>
          <button
            onClick={refetch}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedClients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {hasActiveFilters ? 'No clients match your filters' : 'No clients found'}
          </div>
          {hasActiveFilters ? (
            <button
              onClick={handleClearFilters}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          ) : onClientCreate ? (
            <button
              onClick={onClientCreate}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add your first client
            </button>
          ) : null}
        </div>
      )}

      {/* Client Grid/List */}
      {!loading && !error && sortedClients.length > 0 && (
        <>
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {sortedClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={onClientEdit}
                onDelete={onClientDelete}
                onView={onClientView}
                className={viewMode === 'list' ? 'max-w-none' : ''}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, totalCount)} of {totalCount} clients
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm border rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}