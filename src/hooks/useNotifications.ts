import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Notification, NotificationType } from '@/types'
import useSWR, { mutate } from 'swr'

interface UseNotificationsOptions {
  unreadOnly?: boolean
  type?: NotificationType
  limit?: number
  realtime?: boolean
}

interface NotificationsResponse {
  data: Notification[]
  count: number
  page: number
  limit: number
  totalPages: number
}

const fetcher = async (url: string): Promise<NotificationsResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch notifications')
  }
  return response.json()
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { unreadOnly = false, type, limit = 20, realtime = true } = options
  const [page, setPage] = useState(1)

  // Build query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  
  if (unreadOnly) params.append('unread', 'true')
  if (type) params.append('type', type)

  const key = `/api/notifications?${params.toString()}`
  
  const { data, error, isLoading, mutate: mutateNotifications } = useSWR<NotificationsResponse>(
    key,
    fetcher,
    {
      refreshInterval: realtime ? 30000 : 0, // Refresh every 30 seconds if realtime is enabled
      revalidateOnFocus: true,
    }
  )

  // Set up real-time subscription
  useEffect(() => {
    if (!realtime) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('Notification change:', payload)
          // Revalidate the current query
          mutateNotifications()
          // Also revalidate unread count
          mutate('/api/notifications?unread=true')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [realtime, mutateNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Optimistically update the cache
      mutateNotifications((current) => {
        if (!current) return current
        return {
          ...current,
          data: current.data.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          ),
        }
      }, false)

      // Revalidate unread count
      mutate('/api/notifications?unread=true')
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }, [mutateNotifications])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Revalidate all notification queries
      mutate((key) => typeof key === 'string' && key.startsWith('/api/notifications'))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      // Optimistically update the cache
      mutateNotifications((current) => {
        if (!current) return current
        return {
          ...current,
          data: current.data.filter((notification) => notification.id !== notificationId),
          count: current.count - 1,
        }
      }, false)

      // Revalidate unread count
      mutate('/api/notifications?unread=true')
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }, [mutateNotifications])

  const createNotification = useCallback(async (notification: {
    title: string
    message: string
    type?: NotificationType
    action_url?: string
    user_id?: string
  }) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })

      if (!response.ok) {
        throw new Error('Failed to create notification')
      }

      const result = await response.json()
      
      // Revalidate all notification queries
      mutate((key) => typeof key === 'string' && key.startsWith('/api/notifications'))
      
      return result.data
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }, [])

  return {
    notifications: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    currentPage: page,
    isLoading,
    error,
    setPage,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refresh: mutateNotifications,
  }
}

// Hook specifically for unread notifications count
export function useUnreadNotificationsCount() {
  const { data, error, isLoading } = useSWR<NotificationsResponse>(
    '/api/notifications?unread=true&limit=1',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  return {
    count: data?.count || 0,
    isLoading,
    error,
  }
}