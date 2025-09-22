'use client'

import { useState, useEffect } from 'react'
import { Clock, User, MessageSquare, Calendar } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StageHistoryItem {
  id: string
  from_stage: string | null
  to_stage: string
  changed_by: string | null
  changed_at: string
  notes: string | null
  deadline: string | null
  changed_by_profile?: {
    name: string
    avatar_url?: string
  }
}

interface ClientStageHistoryProps {
  clientId: string
  className?: string
}

const STAGE_COLORS = {
  Lead: 'text-yellow-600 bg-yellow-100',
  Prospect: 'text-blue-600 bg-blue-100',
  Client: 'text-green-600 bg-green-100',
  Closed: 'text-gray-600 bg-gray-100'
}

export function ClientStageHistory({ clientId, className }: ClientStageHistoryProps) {
  const [history, setHistory] = useState<StageHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStageHistory()
  }, [clientId])

  const fetchStageHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients/${clientId}/stage-history`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch stage history')
      }
      
      const data = await response.json()
      setHistory(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getStageChangeText = (item: StageHistoryItem) => {
    if (!item.from_stage) {
      return `Created as ${item.to_stage}`
    }
    return `Moved from ${item.from_stage} to ${item.to_stage}`
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-red-600 mb-2">Failed to load stage history</div>
        <button
          onClick={fetchStageHistory}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Try again
        </button>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        No stage history available
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold text-gray-900">Stage History</h3>
      
      <div className="space-y-4">
        {history.map((item, index) => {
          const formatted = formatDate(item.changed_at)
          const isLast = index === history.length - 1
          
          return (
            <div key={item.id} className="relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200"></div>
              )}
              
              <div className="flex gap-4">
                {/* Avatar/Icon */}
                <div className="relative z-10">
                  {item.changed_by_profile ? (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {getInitials(item.changed_by_profile.name)}
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getStageChangeText(item)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            STAGE_COLORS[item.to_stage as keyof typeof STAGE_COLORS] || 'text-gray-600 bg-gray-100'
                          )}>
                            {item.to_stage}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 text-right">
                        <div>{formatted.date}</div>
                        <div>{formatted.time}</div>
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-2">
                      {/* Changed by */}
                      {item.changed_by_profile && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>Changed by {item.changed_by_profile.name}</span>
                        </div>
                      )}
                      
                      {/* Notes */}
                      {item.notes && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{item.notes}</span>
                        </div>
                      )}
                      
                      {/* Deadline */}
                      {item.deadline && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Deadline set for {formatDate(item.deadline).date} at {formatDate(item.deadline).time}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}