'use client'

import { useState, useEffect } from 'react'
import { 
  User, Mail, Phone, MapPin, Calendar, FileText, Edit, Trash2, 
  DollarSign, Clock, Activity, Plus, Download, Upload, Eye, X 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ClientForm } from './ClientForm'
import { ClientStagePipeline } from './ClientStagePipeline'
import { ClientStageHistory } from './ClientStageHistory'
import { DocumentManager } from './DocumentManager'
import { cn } from '@/utils/cn'
import { useClientForm } from '@/hooks/useClientForm'
import type { ClientWithAgent, ClientType, Document, Transaction, Appointment, ActivityWithUser } from '@/types'

interface ClientProfileProps {
  clientId: string
  onClose?: () => void
  onClientUpdated?: (client: ClientWithAgent) => void
  onClientDeleted?: () => void
  className?: string
}

interface ClientProfileData extends ClientWithAgent {
  documents?: Document[]
  transactions?: Transaction[]
  appointments?: Appointment[]
  activities?: ActivityWithUser[]
}

const CLIENT_TYPE_COLORS = {
  Lead: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Prospect: 'bg-blue-100 text-blue-800 border-blue-200',
  Client: 'bg-green-100 text-green-800 border-green-200',
  Closed: 'bg-gray-100 text-gray-800 border-gray-200'
}

export function ClientProfile({ 
  clientId, 
  onClose, 
  onClientUpdated, 
  onClientDeleted, 
  className 
}: ClientProfileProps) {
  const [client, setClient] = useState<ClientProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'documents' | 'transactions' | 'history'>('overview')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { updateClient, deleteClient, loading: formLoading } = useClientForm({
    onSuccess: (updatedClient) => {
      setClient(prev => prev ? { ...prev, ...updatedClient } : updatedClient)
      setActiveTab('overview')
      onClientUpdated?.(updatedClient)
    },
    onError: (error) => {
      console.error('Client form error:', error)
    }
  })

  // Load client data
  useEffect(() => {
    const loadClient = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/clients/${clientId}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load client')
        }

        const result = await response.json()
        setClient(result.data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (clientId) {
      loadClient()
    }
  }, [clientId])

  const handleStageChange = async (newStage: ClientType, notes?: string) => {
    if (!client) return

    try {
      await updateClient(client.id, { 
        type: newStage,
        notes: notes ? `${client.notes || ''}\n\n[${new Date().toLocaleDateString()}] Stage changed to ${newStage}: ${notes}`.trim() : client.notes
      })
    } catch (error) {
      console.error('Error updating client stage:', error)
    }
  }

  const handleSetDeadline = async (stage: ClientType, deadline: Date) => {
    // This would typically create an appointment or deadline record
    console.log('Setting deadline for stage:', stage, 'on:', deadline)
  }

  const handleDelete = async () => {
    if (!client) return

    try {
      await deleteClient(client.id)
      onClientDeleted?.()
      onClose?.()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Not specified'
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    }
    if (min) return `$${min.toLocaleString()}+`
    if (max) return `Up to $${max.toLocaleString()}`
    return 'Not specified'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Client not found'}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        )}
      </div>
    )
  }

  if (activeTab === 'edit') {
    return (
      <div className={className}>
        <ClientForm
          client={client}
          mode="edit"
          onSave={(data) => updateClient(client.id, data)}
          onCancel={() => setActiveTab('overview')}
        />
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
            {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                CLIENT_TYPE_COLORS[client.type]
              )}>
                {client.type}
              </span>
              {client.source && (
                <span className="text-sm text-gray-500">• Source: {client.source}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'edit', label: 'Edit', icon: Edit },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'transactions', label: 'Transactions', icon: DollarSign },
            { id: 'history', label: 'History', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Email</div>
                      <div className="text-sm text-gray-900">{client.email}</div>
                    </div>
                  </div>
                  
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">Phone</div>
                        <div className="text-sm text-gray-900">{client.phone}</div>
                      </div>
                    </div>
                  )}
                  
                  {client.preferred_area && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">Preferred Area</div>
                        <div className="text-sm text-gray-900">{client.preferred_area}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Budget Range</div>
                      <div className="text-sm text-gray-900">{formatBudget(client.budget_min, client.budget_max)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stage Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Client Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientStagePipeline
                  client={client}
                  onStageChange={handleStageChange}
                  onSetDeadline={handleSetDeadline}
                  interactive={true}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    {client.notes}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setActiveTab('edit')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                >
                  <Edit className="h-4 w-4" />
                  Edit Client
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Client
                </button>
              </CardContent>
            </Card>

            {/* Client Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">Assigned Agent</div>
                  <div className="text-sm text-gray-900">
                    {client.assigned_agent_profile?.name || 'Unassigned'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Created</div>
                  <div className="text-sm text-gray-900">{formatDate(client.created_at)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Last Updated</div>
                  <div className="text-sm text-gray-900">{formatDate(client.updated_at)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Last Contact</div>
                  <div className="text-sm text-gray-900">{formatDate(client.last_contact)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm font-medium">{client.documents?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transactions</span>
                  <span className="text-sm font-medium">{client.transactions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Appointments</span>
                  <span className="text-sm font-medium">{client.appointments?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <DocumentManager 
          clientId={clientId} 
          clientName={client.name}
        />
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Transaction management will be implemented in a future task.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClientStageHistory clientId={client.id} />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Client</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete {client.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={formLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {formLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}