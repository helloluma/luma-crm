'use client'

import { useState } from 'react'
import { Bell, Check, CheckCheck, Filter, Trash2, X } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationType } from '@/types'
import { NotificationItem } from './NotificationItem'
import { NotificationFilters } from './NotificationFilters'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedType, setSelectedType] = useState<NotificationType | undefined>()
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const {
    notifications,
    count,
    totalPages,
    currentPage,
    isLoading,
    error,
    setPage,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications({
    unreadOnly: showUnreadOnly,
    type: selectedType,
    limit: 10,
    realtime: true,
  })

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await markAsRead(notificationId)
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const loadMore = () => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h2>
                {count > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    {count}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close notifications"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-1 rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </button>
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`rounded-md px-3 py-1 text-sm ${
                    showUnreadOnly
                      ? 'bg-blue-100 text-blue-800'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Unread only
                </button>
              </div>
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-1 rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                disabled={notifications.length === 0}
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark all read</span>
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4">
                <NotificationFilters
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <div className="text-sm text-gray-500">Loading notifications...</div>
              </div>
            ) : error ? (
              <div className="flex h-32 items-center justify-center">
                <div className="text-center">
                  <div className="text-sm text-red-600">Failed to load notifications</div>
                  <button
                    onClick={() => refresh()}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <div className="text-center">
                  <Bell className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2 text-sm text-gray-500">
                    {showUnreadOnly ? 'No unread notifications' : 'No notifications'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification.id, notification.read)}
                    onDelete={() => handleDeleteNotification(notification.id)}
                  />
                ))}
                
                {/* Load more button */}
                {currentPage < totalPages && (
                  <div className="p-4">
                    <button
                      onClick={loadMore}
                      className="w-full rounded-md border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}