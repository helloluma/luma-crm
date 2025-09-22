'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Edit, Trash2, Save, X, AlertTriangle } from 'lucide-react'
import { useClientStage } from '@/hooks/useClientStage'
import { ClientType } from '@/types'

interface DeadlineManagerProps {
  clientId: string
  clientName: string
  currentStage: ClientType
  onDeadlineUpdated?: () => void
}

interface StageDeadline {
  id: string
  client_id: string
  stage: string
  deadline: string
  alert_sent: boolean
  alert_sent_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

interface DeadlineForm {
  stage: ClientType
  deadline: string
  time: string
}

export default function DeadlineManager({
  clientId,
  clientName,
  currentStage,
  onDeadlineUpdated
}: DeadlineManagerProps) {
  const [deadlines, setDeadlines] = useState<StageDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<StageDeadline | null>(null)
  const [formData, setFormData] = useState<DeadlineForm>({
    stage: currentStage,
    deadline: '',
    time: '09:00'
  })

  const { fetchStageDeadlines, setStageDeadline } = useClientStage()

  const stageOptions: { value: ClientType; label: string; defaultDays: number }[] = [
    { value: 'Lead', label: 'Lead Follow-up', defaultDays: 7 },
    { value: 'Prospect', label: 'Prospect Conversion', defaultDays: 14 },
    { value: 'Client', label: 'Deal Closing', defaultDays: 30 },
    { value: 'Closed', label: 'Post-Closing', defaultDays: 7 }
  ]

  const fetchDeadlines = async () => {
    setLoading(true)
    setError(null)

    try {
      const clientDeadlines = await fetchStageDeadlines(clientId)
      setDeadlines(clientDeadlines)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deadlines')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeadlines()
  }, [clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const deadlineDateTime = new Date(`${formData.deadline}T${formData.time}`)
      
      if (isNaN(deadlineDateTime.getTime())) {
        throw new Error('Invalid date or time')
      }

      await setStageDeadline(clientId, formData.stage, deadlineDateTime)
      
      // Refresh deadlines
      await fetchDeadlines()
      
      // Reset form
      setShowForm(false)
      setEditingDeadline(null)
      setFormData({
        stage: currentStage,
        deadline: '',
        time: '09:00'
      })

      onDeadlineUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deadline')
    }
  }

  const handleEdit = (deadline: StageDeadline) => {
    const deadlineDate = new Date(deadline.deadline)
    setEditingDeadline(deadline)
    setFormData({
      stage: deadline.stage as ClientType,
      deadline: deadlineDate.toISOString().split('T')[0],
      time: deadlineDate.toTimeString().slice(0, 5)
    })
    setShowForm(true)
  }

  const handleDelete = async (deadlineId: string) => {
    if (!confirm('Are you sure you want to delete this deadline?')) {
      return
    }

    try {
      const response = await fetch(`/api/deadlines/${deadlineId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete deadline')
      }

      await fetchDeadlines()
      onDeadlineUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deadline')
    }
  }

  const setDefaultDeadline = (stage: ClientType) => {
    const stageOption = stageOptions.find(opt => opt.value === stage)
    if (stageOption) {
      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + stageOption.defaultDays)
      
      setFormData({
        stage,
        deadline: defaultDate.toISOString().split('T')[0],
        time: '09:00'
      })
    }
  }

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 0) {
      return { status: 'overdue', color: 'text-red-600', bgColor: 'bg-red-50' }
    } else if (diffHours < 24) {
      return { status: 'urgent', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    } else if (diffHours < 72) {
      return { status: 'upcoming', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    } else {
      return { status: 'normal', color: 'text-green-600', bgColor: 'bg-green-50' }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Deadline Management</h3>
          <p className="text-sm text-gray-600">Manage deadlines for {clientName}</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingDeadline(null)
            setDefaultDeadline(currentStage)
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Deadline</span>
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-4">
              {editingDeadline ? 'Edit Deadline' : 'Add New Deadline'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => {
                      const newStage = e.target.value as ClientType
                      setFormData({ ...formData, stage: newStage })
                      if (!formData.deadline) {
                        setDefaultDeadline(newStage)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {stageOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingDeadline ? 'Update' : 'Save'} Deadline</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingDeadline(null)
                    setError(null)
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {deadlines.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No deadlines set for this client</p>
            <p className="text-sm text-gray-400 mt-1">
              Add deadlines to track important milestones
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deadlines
              .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
              .map((deadline) => {
                const { status, color, bgColor } = getDeadlineStatus(deadline.deadline)
                const deadlineDate = new Date(deadline.deadline)

                return (
                  <div
                    key={deadline.id}
                    className={`p-4 rounded-lg border ${bgColor} transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className={`h-4 w-4 ${color}`} />
                          <span className="font-medium text-gray-900">
                            {deadline.stage} Stage Deadline
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === 'overdue' ? 'bg-red-100 text-red-800' :
                            status === 'urgent' ? 'bg-orange-100 text-orange-800' :
                            status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Due: {deadlineDate.toLocaleDateString()} at{' '}
                          {deadlineDate.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(deadline.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(deadline)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit deadline"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(deadline.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete deadline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}