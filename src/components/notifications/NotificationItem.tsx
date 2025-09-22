'use client'

import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, CheckCircle, Info, Trash2, XCircle } from 'lucide-react'
import { Notification } from '@/types'

interface NotificationItemProps {
  notification: Notification
  onClick: () => void
  onDelete: () => void
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
}

const typeColors = {
  info: 'text-blue-600 bg-blue-100',
  success: 'text-green-600 bg-green-100',
  warning: 'text-yellow-600 bg-yellow-100',
  error: 'text-red-600 bg-red-100',
}

export function NotificationItem({ notification, onClick, onDelete }: NotificationItemProps) {
  const Icon = typeIcons[notification.type]
  const colorClass = typeColors[notification.type]

  const handleClick = () => {
    onClick()
    
    // If there's an action URL, navigate to it
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div
      className={`group relative cursor-pointer px-6 py-4 hover:bg-gray-50 ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 rounded-full p-1 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${
                !notification.read ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {notification.title}
              </p>
              <p className={`mt-1 text-sm ${
                !notification.read ? 'text-gray-700' : 'text-gray-500'
              }`}>
                {notification.message}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="ml-2 flex-shrink-0 rounded-md p-1 text-gray-400 opacity-0 hover:bg-gray-200 hover:text-gray-600 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.read && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-blue-600" />
          </div>
        )}
      </div>
    </div>
  )
}