'use client'

import { useState } from 'react'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { formatDistanceToNow } from 'date-fns'
import { 
  User, 
  FileText, 
  Calendar, 
  DollarSign, 
  UserPlus, 
  Clock,
  Filter,
  RefreshCw,
  ChevronDown,
  AlertCircle
} from 'lucide-react'
import type { ActivityType } from '@/types'

interface ActivityFeedProps {
  className?: string
  limit?: number
  showFilters?: boolean
  realtime?: boolean
}

const activityIcons: Record<string, React.ComponentType<any>> = {
  client_created: UserPlus,
  client_updated: User,
  transaction_created: DollarSign,
  transaction_updated: DollarSign,
  appointment_created: Calendar,
  appointment_updated: Calendar,
  document_uploaded: FileText,
  note_added: FileText,
}

const activityColors: Record<string, string> = {
  client_created: 'bg-green-100 text-green-600',
  client_updated: 'bg-blue-100 text-blue-600',
  transaction_created: 'bg-emerald-100 text-emerald-600',
  transaction_updated: 'bg-emerald-100 text-emerald-600',
  appointment_created: 'bg-purple-100 text-purple-600',
  appointment_updated: 'bg-purple-100 text-purple-600',
  document_uploaded: 'bg-orange-100 text-orange-600',
  note_added: 'bg-gray-100 text-gray-600',
}

export function ActivityFeed({ 
  className = '', 
  limit = 10, 
  showFilters = true,
  realtime = true 
}: ActivityFeedProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedEntityType, setSelectedEntityType] = useState<string>('')

  const { 
    activities, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  } = useActivityFeed({
    limit,
    type: selectedType || undefined,
    entityType: selectedEntityType || undefined,
    realtime,
  })

  const handleTypeFilter = (type: string) => {
    setSelectedType(type === selectedType ? '' : type)
  }

  const handleEntityTypeFilter = (entityType: string) => {
    setSelectedEntityType(entityType === selectedEntityType ? '' : entityType)
  }

  const getActivityIcon = (type: string) => {
    const IconComponent = activityIcons[type] || Clock
    return IconComponent
  }

  const getActivityColor = (type: string) => {
    return activityColors[type] || 'bg-gray-100 text-gray-600'
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Error loading activities: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {showFilters && (
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            <select
              value={selectedType}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="client_created">Client Created</option>
              <option value="client_updated">Client Updated</option>
              <option value="transaction_created">Transaction Created</option>
              <option value="transaction_updated">Transaction Updated</option>
              <option value="appointment_created">Appointment Created</option>
              <option value="appointment_updated">Appointment Updated</option>
              <option value="document_uploaded">Document Uploaded</option>
            </select>

            <select
              value={selectedEntityType}
              onChange={(e) => handleEntityTypeFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Entities</option>
              <option value="client">Clients</option>
              <option value="transaction">Transactions</option>
              <option value="appointment">Appointments</option>
              <option value="document">Documents</option>
            </select>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-200">
        {loading && activities.length === 0 ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No activities found</p>
          </div>
        ) : (
          <>
            {activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.type)
              const colorClass = getActivityColor(activity.type)

              return (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                      )}

                      {/* Metadata */}
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                            >
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* User info */}
                      {activity.user && (
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <span>by {activity.user.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Load More Button */}
            {hasMore && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}