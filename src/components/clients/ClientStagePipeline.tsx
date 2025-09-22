'use client'

import { useState } from 'react'
import { Check, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Client, ClientType } from '@/types'

interface ClientStagePipelineProps {
  client: Client
  onStageChange?: (clientId: string, newStage: ClientType, notes?: string) => Promise<void>
  onSetDeadline?: (clientId: string, stage: ClientType, deadline: Date) => Promise<void>
  className?: string
  interactive?: boolean
}

const STAGES: { value: ClientType; label: string; description: string }[] = [
  { value: 'Lead', label: 'Lead', description: 'Initial contact or inquiry' },
  { value: 'Prospect', label: 'Prospect', description: 'Qualified and interested' },
  { value: 'Client', label: 'Client', description: 'Active client with agreement' },
  { value: 'Closed', label: 'Closed', description: 'Deal completed or lost' }
]

const STAGE_COLORS = {
  Lead: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    text: 'text-yellow-800',
    icon: 'text-yellow-600'
  },
  Prospect: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-800',
    icon: 'text-blue-600'
  },
  Client: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-800',
    icon: 'text-green-600'
  },
  Closed: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-800',
    icon: 'text-gray-600'
  }
}

export function ClientStagePipeline({ 
  client, 
  onStageChange, 
  onSetDeadline, 
  className, 
  interactive = false 
}: ClientStagePipelineProps) {
  const [selectedStage, setSelectedStage] = useState<ClientType | null>(null)
  const [notes, setNotes] = useState('')
  const [deadline, setDeadline] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const currentStageIndex = STAGES.findIndex(stage => stage.value === client.type)

  const handleStageClick = (stage: ClientType) => {
    if (!interactive || !onStageChange) return
    setSelectedStage(stage)
  }

  const handleStageConfirm = async () => {
    if (!selectedStage || !onStageChange) return
    
    setIsLoading(true)
    try {
      await onStageChange(client.id, selectedStage, notes.trim() || undefined)
      
      // Set deadline if provided
      if (deadline && onSetDeadline) {
        await onSetDeadline(client.id, selectedStage, new Date(deadline))
      }
      
      setSelectedStage(null)
      setNotes('')
      setDeadline('')
    } catch (error) {
      console.error('Failed to update stage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStageCancel = () => {
    setSelectedStage(null)
    setNotes('')
    setDeadline('')
  }

  const getStageStatus = (stageIndex: number) => {
    if (stageIndex < currentStageIndex) return 'completed'
    if (stageIndex === currentStageIndex) return 'current'
    return 'upcoming'
  }

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null
    const date = new Date(deadline)
    const now = new Date()
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 0) return { text: 'Overdue', status: 'overdue' }
    if (diffHours < 24) return { text: 'Due today', status: 'urgent' }
    if (diffHours < 48) return { text: 'Due tomorrow', status: 'warning' }
    
    return { 
      text: `Due ${date.toLocaleDateString()}`, 
      status: 'normal' 
    }
  }

  const deadlineInfo = formatDeadline(client.stage_deadline)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Pipeline Visual */}
      <div className="flex items-center justify-between">
        {STAGES.map((stage, index) => {
          const status = getStageStatus(index)
          const colors = STAGE_COLORS[stage.value]
          const isClickable = interactive && onStageChange && status !== 'completed'
          
          return (
            <div key={stage.value} className="flex items-center flex-1">
              {/* Stage Circle */}
              <div
                className={cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                  status === 'completed' && 'bg-green-500 border-green-500',
                  status === 'current' && `${colors.bg} ${colors.border}`,
                  status === 'upcoming' && 'bg-gray-100 border-gray-300',
                  isClickable && 'cursor-pointer hover:scale-105'
                )}
                onClick={() => isClickable && handleStageClick(stage.value)}
              >
                {status === 'completed' ? (
                  <Check className="w-5 h-5 text-white" />
                ) : status === 'current' ? (
                  <Clock className={cn('w-5 h-5', colors.icon)} />
                ) : (
                  <div className={cn('w-3 h-3 rounded-full', 
                    status === 'upcoming' ? 'bg-gray-400' : colors.bg
                  )} />
                )}
              </div>
              
              {/* Stage Label */}
              <div className="ml-3 flex-1">
                <div className={cn(
                  'text-sm font-medium',
                  status === 'completed' && 'text-green-700',
                  status === 'current' && colors.text,
                  status === 'upcoming' && 'text-gray-500'
                )}>
                  {stage.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {stage.description}
                </div>
              </div>
              
              {/* Connector Arrow */}
              {index < STAGES.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              )}
            </div>
          )
        })}
      </div>

      {/* Deadline Information */}
      {deadlineInfo && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
          deadlineInfo.status === 'overdue' && 'bg-red-50 text-red-700',
          deadlineInfo.status === 'urgent' && 'bg-orange-50 text-orange-700',
          deadlineInfo.status === 'warning' && 'bg-yellow-50 text-yellow-700',
          deadlineInfo.status === 'normal' && 'bg-blue-50 text-blue-700'
        )}>
          <AlertTriangle className="w-4 h-4" />
          <span>{deadlineInfo.text}</span>
        </div>
      )}

      {/* Stage Change Modal */}
      {selectedStage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Move to {STAGES.find(s => s.value === selectedStage)?.label}
            </h3>
            
            <div className="space-y-4">
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add notes about this stage change..."
                />
              </div>

              {/* Deadline */}
              {selectedStage !== 'Closed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set Deadline (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleStageConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Updating...' : 'Confirm'}
                </button>
                <button
                  onClick={handleStageCancel}
                  disabled={isLoading}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}