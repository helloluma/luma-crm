'use client'

import { useState } from 'react'
import { User, Mail, Phone, MapPin, Calendar, MoreVertical, Edit, Trash2, Eye, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { ClientStagePipeline } from './ClientStagePipeline'
import { cn } from '@/utils/cn'
import type { ClientWithAgent, ClientType } from '@/types'

interface ClientCardProps {
  client: ClientWithAgent
  onEdit?: (client: ClientWithAgent) => void
  onDelete?: (client: ClientWithAgent) => void
  onView?: (client: ClientWithAgent) => void
  onStageChange?: (clientId: string, newStage: ClientType, notes?: string) => Promise<void>
  onSetDeadline?: (clientId: string, stage: ClientType, deadline: Date) => Promise<void>
  className?: string
  showPipeline?: boolean
}

const CLIENT_TYPE_COLORS = {
  Lead: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Prospect: 'bg-blue-100 text-blue-800 border-blue-200',
  Client: 'bg-green-100 text-green-800 border-green-200',
  Closed: 'bg-gray-100 text-gray-800 border-gray-200'
}

export function ClientCard({ 
  client, 
  onEdit, 
  onDelete, 
  onView, 
  onStageChange, 
  onSetDeadline, 
  className, 
  showPipeline = false 
}: ClientCardProps) {
  const [showActions, setShowActions] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    }
    if (min) return `$${min.toLocaleString()}+`
    if (max) return `Up to $${max.toLocaleString()}`
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={cn('relative group hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-6">
        {/* Header with Avatar and Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {getInitials(client.name)}
            </div>
            
            {/* Name and Type */}
            <div>
              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                {client.name}
              </h3>
              <span className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-1',
                CLIENT_TYPE_COLORS[client.type]
              )}>
                {client.type}
              </span>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Client actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                {onView && (
                  <button
                    onClick={() => {
                      onView(client)
                      setShowActions(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                )}
                {onStageChange && (
                  <button
                    onClick={() => {
                      // Toggle pipeline view
                      setShowActions(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Manage Stage
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(client)
                      setShowActions(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Client
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(client)
                      setShowActions(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Client
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
          
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}
          
          {client.preferred_area && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{client.preferred_area}</span>
            </div>
          )}
        </div>

        {/* Budget Information */}
        {formatBudget(client.budget_min, client.budget_max) && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Budget Range</div>
            <div className="text-sm text-gray-600">
              {formatBudget(client.budget_min, client.budget_max)}
            </div>
          </div>
        )}

        {/* Source */}
        {client.source && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Source</div>
            <div className="text-sm text-gray-600">{client.source}</div>
          </div>
        )}

        {/* Footer with Agent and Last Contact */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>
                {client.assigned_agent_profile?.name || 'Unassigned'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Last contact: {formatDate(client.last_contact)}</span>
            </div>
          </div>
        </div>

        {/* Stage Pipeline */}
        {showPipeline && onStageChange && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <ClientStagePipeline
              client={client}
              onStageChange={onStageChange}
              onSetDeadline={onSetDeadline}
              interactive={true}
            />
          </div>
        )}

        {/* Notes Preview */}
        {client.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Notes</div>
            <div className="text-sm text-gray-600 line-clamp-2">
              {client.notes}
            </div>
          </div>
        )}
      </CardContent>

      {/* Click outside to close actions menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </Card>
  )
}