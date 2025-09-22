'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Clock, AlertTriangle, CheckCircle, Calendar, Bell, Settings } from 'lucide-react'
import { useClientStage } from '@/hooks/useClientStage'
import { Client } from '@/types'

interface Deadline {
  id: string
  client_id: string
  stage: string
  deadline: string
  alert_sent: boolean
  alert_sent_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  client?: {
    name: string
    type: string
  }
}

interface DeadlineTrackerProps {
  clientId?: string
  showAllDeadlines?: boolean
  maxItems?: number
  onDeadlineClick?: (deadline: Deadline) => void
}

export default function DeadlineTracker({
  clientId,
  showAllDeadlines = false,
  maxItems = 10,
  onDeadlineClick
}: DeadlineTrackerProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const { fetchStageDeadlines } = useClientStage()

  const fetchDeadlines = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (clientId) {
        // Fetch deadlines for specific client
        const clientDeadlines = await fetchStageDeadlines(clientId)
        setDeadlines(clientDeadlines)
      } else if (showAllDeadlines) {
        // Fetch all upcoming deadlines
        const response = await fetch('/api/deadlines/upcoming')
        if (!response.ok) {
          throw new Error('Failed to fetch deadlines')
        }
        const data = await response.json()
        setDeadlines(data.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deadlines')
    } finally {
      setLoading(false)
    }
  }, [clientId, showAllDeadlines, fetchStageDeadlines])

  useEffect(() => {
    fetchDeadlines()
  }, [fetchDeadlines])

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 0) {
      return { status: 'overdue', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle }
    } else if (diffHours < 24) {
      return { status: 'urgent', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle }
    } else if (diffHours < 72) {
      return { status: 'upcoming', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock }
    } else {
      return { status: 'normal', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle }
    }
  }

  const formatDeadlineTime = (deadline: string) => {
    const date = new Date(deadline)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else if (diffDays < 7) {
      return `Due in ${diffDays} days`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getPriorityLevel = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 0) return 'critical'
    if (diffHours < 24) return 'high'
    if (diffHours < 72) return 'medium'
    return 'low'
  }

  const sortedDeadlines = deadlines
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, maxItems)

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Deadline Tracker</h3>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Deadline Tracker</h3>
          <button
            onClick={fetchDeadlines}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Retry
          </button>
        </div>
        <div className="text-center py-4">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          {clientId ? 'Client Deadlines' : 'Upcoming Deadlines'}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
            title="Deadline Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={fetchDeadlines}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <Clock className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {sortedDeadlines.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming deadlines</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDeadlines.map((deadline) => {
              const { status, color, bgColor, icon: StatusIcon } = getDeadlineStatus(deadline.deadline)
              const priority = getPriorityLevel(deadline.deadline)

              return (
                <div
                  key={deadline.id}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    priority === 'critical' ? 'border-l-red-500' :
                    priority === 'high' ? 'border-l-orange-500' :
                    priority === 'medium' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                  } ${bgColor}`}
                  onClick={() => onDeadlineClick?.(deadline)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <StatusIcon className={`h-4 w-4 ${color}`} />
                        <span className="font-medium text-gray-900">
                          {deadline.stage} Stage
                        </span>
                        {deadline.client && (
                          <span className="text-sm text-gray-500">
                            • {deadline.client.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {formatDeadlineTime(deadline.deadline)}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          Due: {new Date(deadline.deadline).toLocaleDateString()} at{' '}
                          {new Date(deadline.deadline).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {deadline.alert_sent && (
                          <span className="flex items-center space-x-1">
                            <Bell className="h-3 w-3" />
                            <span>Alert sent</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      priority === 'critical' ? 'bg-red-100 text-red-800' :
                      priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {priority.toUpperCase()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {deadlines.length > maxItems && (
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View all {deadlines.length} deadlines
            </button>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="border-t p-6 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Reminder Settings</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Email reminders 24 hours before</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">SMS alerts for urgent deadlines</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">In-app notifications</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}