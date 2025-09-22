import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { useSMSNotifications } from '../useSMSNotifications'

// Mock fetch
global.fetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSMSNotifications', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSMSNotifications())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.sendSMSNotification).toBe('function')
    expect(typeof result.current.sendDeadlineReminderSMS).toBe('function')
    expect(typeof result.current.sendAppointmentReminderSMS).toBe('function')
    expect(typeof result.current.sendUrgentNotificationSMS).toBe('function')
    expect(typeof result.current.sendCustomSMS).toBe('function')
    expect(typeof result.current.clearError).toBe('function')
  })

  it('should send SMS notification successfully', async () => {
    const mockResponse = {
      success: true,
      sent: 1,
      failed: 0,
      results: [{ phoneNumber: '+1234567890', success: true, messageId: 'sms-1' }]
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useSMSNotifications())

    const recipients = [{ phoneNumber: '+1234567890', name: 'Test User' }]
    const response = await result.current.sendSMSNotification({
      type: 'urgent',
      recipients,
      title: 'Test Alert',
      message: 'Test message'
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'urgent',
        recipients,
        title: 'Test Alert',
        message: 'Test message'
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

    const { result } = renderHook(() => useSMSNotifications())

    let response
    await act(async () => {
      response = await result.current.sendSMSNotification({
        type: 'urgent',
        recipients: [{ phoneNumber: '+1234567890' }],
        message: 'Test message'
      })
    })

    expect(response).toBeNull()
    expect(result.current.error).toBe('API Error')
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle network errors', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSMSNotifications())

    let response
    await act(async () => {
      response = await result.current.sendSMSNotification({
        type: 'urgent',
        recipients: [{ phoneNumber: '+1234567890' }],
        message: 'Test message'
      })
    })

    expect(response).toBeNull()
    expect(result.current.error).toBe('Network error')
    expect(result.current.isLoading).toBe(false)
  })

  it('should send deadline reminder SMS using convenience method', async () => {
    const mockResponse = { success: true, sent: 1, failed: 0, results: [] }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useSMSNotifications())

    const recipients = [{ 
      phoneNumber: '+1234567890', 
      name: 'Test User',
      clientName: 'John Doe',
      deadline: '2024-01-15'
    }]
    
    await result.current.sendDeadlineReminderSMS(
      recipients,
      'Contract deadline approaching'
    )

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'deadline',
        recipients,
        message: 'Contract deadline approaching'
      }),
    })
  })

  it('should send appointment reminder SMS using convenience method', async () => {
    const mockResponse = { success: true, sent: 1, failed: 0, results: [] }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useSMSNotifications())

    const recipients = [{ 
      phoneNumber: '+1234567890', 
      name: 'Test User',
      appointmentTime: '2024-01-15 10:00 AM',
      clientName: 'Jane Smith',
      location: '123 Main St'
    }]
    
    await result.current.sendAppointmentReminderSMS(
      recipients,
      'Property Showing'
    )

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'appointment',
        recipients,
        title: 'Property Showing',
        message: 'You have an upcoming appointment.'
      }),
    })
  })

  it('should send urgent notification SMS using convenience method', async () => {
    const mockResponse = { success: true, sent: 1, failed: 0, results: [] }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useSMSNotifications())

    const recipients = [{ phoneNumber: '+1234567890', name: 'Test User' }]
    
    await result.current.sendUrgentNotificationSMS(
      recipients,
      'Urgent Alert',
      'This is an urgent notification'
    )

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'urgent',
        recipients,
        title: 'Urgent Alert',
        message: 'This is an urgent notification'
      }),
    })
  })

  it('should send custom SMS using convenience method', async () => {
    const mockResponse = { success: true, sent: 1, failed: 0, results: [] }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useSMSNotifications())

    const recipients = [{ phoneNumber: '+1234567890', name: 'Test User' }]
    
    await result.current.sendCustomSMS(
      recipients,
      'Custom SMS message'
    )

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'custom',
        recipients,
        message: 'Custom SMS message'
      }),
    })
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useSMSNotifications())

    result.current.clearError()

    expect(result.current.error).toBeNull()
  })

  it('should set loading state during API call', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(promise)

    const { result } = renderHook(() => useSMSNotifications())

    // Start the API call
    let apiCall: Promise<any>
    act(() => {
      apiCall = result.current.sendSMSNotification({
        type: 'urgent',
        recipients: [{ phoneNumber: '+1234567890' }],
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