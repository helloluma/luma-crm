'use client'

import React from 'react'
import { format } from 'date-fns'
import { X, Calendar, Clock, MapPin, User, Phone, Mail, FileText } from 'lucide-react'
import { AppointmentWithClient } from '@/types'

interface AppointmentModalProps {
  appointment: AppointmentWithClient | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (appointment: AppointmentWithClient) => void
  onDelete?: (appointmentId: string) => void
}

const APPOINTMENT_TYPE_COLORS = {
  Showing: 'bg-blue-100 text-blue-800',
  Meeting: 'bg-green-100 text-green-800',
  Call: 'bg-yellow-100 text-yellow-800',
  Deadline: 'bg-red-100 text-red-800',
} as const

const APPOINTMENT_STATUS_COLORS = {
  Scheduled: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
} as const

export default function AppointmentModal({
  appointment,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: AppointmentModalProps) {
  if (!isOpen || !appointment) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEdit = () => {
    onEdit?.(appointment)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      onDelete?.(appointment.id)
      onClose()
    }
  }

  const startTime = new Date(appointment.start_time)
  const endTime = new Date(appointment.end_time)
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Appointment Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {appointment.title}
            </h3>
            <div className="flex items-center space-x-2">
              {appointment.type && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  APPOINTMENT_TYPE_COLORS[appointment.type as keyof typeof APPOINTMENT_TYPE_COLORS] || 'bg-gray-100 text-gray-800'
                }`}>
                  {appointment.type}
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                APPOINTMENT_STATUS_COLORS[appointment.status as keyof typeof APPOINTMENT_STATUS_COLORS] || 'bg-gray-100 text-gray-800'
              }`}>
                {appointment.status}
              </span>
            </div>
          </div>

          {/* Description */}
          {appointment.description && (
            <div>
              <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 mr-2" />
                Description
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {appointment.description}
              </p>
            </div>
          )}

          {/* Date and Time */}
          <div>
            <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 mr-2" />
              Date & Time
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span>
                  {format(startTime, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-4 mr-2"></span>
                <span>
                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                </span>
                <span className="text-gray-400 ml-2">
                  ({duration} minutes)
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          {appointment.location && (
            <div>
              <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 mr-2" />
                Location
              </div>
              <p className="text-sm text-gray-600">
                {appointment.location}
              </p>
            </div>
          )}

          {/* Client Information */}
          {appointment.client && (
            <div>
              <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 mr-2" />
                Client
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {appointment.client.name}
                </div>
                <div className="space-y-1">
                  {appointment.client.email && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Mail className="h-3 w-3 mr-2" />
                      <a
                        href={`mailto:${appointment.client.email}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {appointment.client.email}
                      </a>
                    </div>
                  )}
                  {appointment.client.phone && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Phone className="h-3 w-3 mr-2" />
                      <a
                        href={`tel:${appointment.client.phone}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {appointment.client.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recurring Information */}
          {appointment.is_recurring && (
            <div>
              <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                Recurring
              </div>
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                <div className="flex items-center">
                  <span className="font-medium">This is a recurring appointment</span>
                </div>
                {appointment.recurrence_rule && (
                  <div className="text-xs text-gray-500 mt-1">
                    Rule: {appointment.recurrence_rule}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Created By */}
          {appointment.created_by_profile && (
            <div>
              <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 mr-2" />
                Created By
              </div>
              <p className="text-sm text-gray-600">
                {appointment.created_by_profile.name}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-200">
            <div>Created: {format(new Date(appointment.created_at), 'MMM d, yyyy h:mm a')}</div>
            <div>Updated: {format(new Date(appointment.updated_at), 'MMM d, yyyy h:mm a')}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Close
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Delete
            </button>
          )}
          {onEdit && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}