import { renderHook, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { useNotifications, useUnreadNotificationsCount } from '../useNotifications'
import { createClient } from '@/lib/supabase'

// Mock SWR
vi.mock('swr', () => ({
  __esModule: true,
  default: vi.fn((key, fetcher, options) => ({
    data: null,
    error: null,
    isLoading: false,
    mutate: vi.fn(),
  })),
  mutate: vi.fn(),
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

const mockSupabase = {
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(),
    })),
  })),
  removeChannel: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase)
  ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: { id: '1' } }),
  })
})

describe('useNotifications', () => {
  it('should initialize with default options', () => {
    const { result } = renderHook(() => useNotifications())

    expect(result.current.notifications).toEqual([])
    expect(result.current.count).toBe(0)
    expect(result.current.totalPages).toBe(0)
    expect(result.current.currentPage).toBe(1)
  })

  it('should mark notification as read', async () => {
    const { result } = renderHook(() => useNotifications())

    await result.current.markAsRead('notification-1')

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/notification-1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ read: true }),
    })
  })

  it('should mark all notifications as read', async () => {
    const { result } = renderHook(() => useNotifications())

    await result.current.markAllAsRead()

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/mark-all-read', {
      method: 'PATCH',
    })
  })

  it('should delete notification', async () => {
    const { result } = renderHook(() => useNotifications())

    await result.current.deleteNotification('notification-1')

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/notification-1', {
      method: 'DELETE',
    })
  })

  it('should create notification', async () => {
    const { result } = renderHook(() => useNotifications())

    const notificationData = {
      title: 'Test Notification',
      message: 'Test message',
      type: 'info' as const,
    }

    await result.current.createNotification(notificationData)

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    })
  })

  it('should handle errors when marking as read', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useNotifications())

    await expect(result.current.markAsRead('notification-1')).rejects.toThrow(
      'Failed to mark notification as read'
    )
  })

  it('should handle errors when creating notification', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
    })

    const { result } = renderHook(() => useNotifications())

    await expect(
      result.current.createNotification({
        title: 'Test',
        message: 'Test message',
      })
    ).rejects.toThrow('Failed to create notification')
  })

  it('should set up realtime subscription when enabled', () => {
    renderHook(() => useNotifications({ realtime: true }))

    expect(mockSupabase.channel).toHaveBeenCalledWith('notifications')
  })

  it('should not set up realtime subscription when disabled', () => {
    renderHook(() => useNotifications({ realtime: false }))

    expect(mockSupabase.channel).not.toHaveBeenCalled()
  })
})

describe('useUnreadNotificationsCount', () => {
  it('should return unread count', () => {
    const { result } = renderHook(() => useUnreadNotificationsCount())

    expect(result.current.count).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})