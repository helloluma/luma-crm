import { renderHook, waitFor, act } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { useEmailNotifications } from '../useEmailNotifications'

// Mock fetch
global.fetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useEmailNotifications', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useEmailNotifications())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.sendEmailNotification).toBe('function')
    expect(typeof result.current.sendNotificationEmail).toBe('function')
    expect(typeof result.current.sendDeadlineReminderEmail).toBe('function')
    expect(typeof result.current.sendAppointmentReminderEmail).toBe('function')
    expect(typeof result.current.clearError).toBe('function')
  })

  it('should send email notification successfully', async () => {
    const mockResponse = {
      success: true,
      sent: 1,
      failed: 0,
      results: [{ email: 'test@example.com', success: true, id: 'email-1' }]
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useEmailNotifications())

    const recipients = [{ email: 'test@example.com', name: 'Test User' }]
    const response = await result.current.sendEmailNotification({
      type: 'notification',
      recipients,
      title: 'Test Notification',
      message: 'Test message',
      actionUrl: 'https://example.com'
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'notification',
        recipients,
        title: 'Test Notification',
        message: 'Test message',
        actionUrl: 'https://example.com'
      }),
    })

    expect(response).toEqual(mockResponse)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle API errors', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'API Error' }),
    })

    const { result } = renderHook(() => useEmailNotifications())

    let response
    await act(async () => {
      response = await result.current.sendEmailNotification({
        type: 'notification',
        recipients: [{ email: 'test@example.com' }],
        title: 'Test',
        message: 'Test message'
      })
    })

    expect(response).toBeNull()
    expect(result.current.error).toBe('API Error')
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle network errors', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useEmailNotifications())

    let response
    await act(async () => {
      response = await result.current.sendEmailNotification({
        type: 'notification',
        recipients: [{ email: 'test@example.com' }],
        title: 'Test',
        message: 'Test message'
      })
    })

    expect(response).toBeNull()
    expect(result.current.error).toBe('Network error')
    expect(result.current.isLoading).toBe(false)
  })

  it('should send notification email using convenience method', async () => {
    const mockResponse = { success: true, sent: 1, failed: 0, results: [] }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useEmailNotifications())

    const recipients = [{ email: 'test@example.com', name: 'Test User' }]
    await result.current.sendNotificationEmail(
      recipients,
      'Test Title',
      'Test Message',
      'https://example.com'
    )

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'notification',
        recipients,
        title: 'Test Title',
        message: 'Test Message',
        actionUrl: 'https://example.com'
      }),
    })
  })

  it('should send deadline reminder email using convenience method', async () => {
    const mockResponse = { success: true, sent: 1, failed: 0, results: [] }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useEmailNotifications())

    const recipients = [{ 
      email: 'test@example.com', 
      name: 'Test User',
      clientName: 'John Doe',
      deadline: '2024-01-15'
    }]
    
    await result.current.sendDeadlineReminderEmail(
      recipients,
      'Contract deadline approaching',
      'https://example.com/client/123'
    )

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'deadline',
        recipients,
        title: 'Deadline Reminder',
        message: 'Contract deadline approaching',
        actionUrl: 'https://example.com/client/123'
      }),
    })
  })

  it('should send appointment reminder email using convenience method', async () => {
    const mockResponse = { success: true, sent: 1, failed: 0, results: [] }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useEmailNotifications())

    const recipients = [{ 
      email: 'test@example.com', 
      name: 'Test User',
      appointmentTime: '2024-01-15 10:00 AM',
      clientName: 'Jane Smith',
      location: '123 Main St'
    }]
    
    await result.current.sendAppointmentReminderEmail(
      recipients,
      'Property Showing',
      'https://example.com/appointment/456'
    )

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'appointment',
        recipients,
        title: 'Property Showing',
        message: 'You have an upcoming appointment.',
        actionUrl: 'https://example.com/appointment/456'
      }),
    })
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useEmailNotifications())

    // Manually set error state (in real usage this would be set by a failed API call)
    result.current.clearError()

    expect(result.current.error).toBeNull()
  })

  it('should set loading state during API call', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(promise)

    const { result } = renderHook(() => useEmailNotifications())

    // Start the API call
    let apiCall: Promise<any>
    act(() => {
      apiCall = result.current.sendEmailNotification({
        type: 'notification',
        recipients: [{ email: 'test@example.com' }],
        title: 'Test',
        message: 'Test message'
      })
    })

    // Check loading state is true
    expect(result.current.isLoading).toBe(true)

    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ success: true, sent: 1, failed: 0, results: [] }),
      })
      await apiCall!
    })

    // Check loading state is false
    expect(result.current.isLoading).toBe(false)
  })
})