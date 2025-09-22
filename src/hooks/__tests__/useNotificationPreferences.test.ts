import { renderHook, act } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { useNotificationPreferences } from '../useNotificationPreferences'

// Mock SWR
vi.mock('swr', () => ({
  __esModule: true,
  default: vi.fn((key, fetcher, options) => ({
    data: null,
    error: null,
    mutate: vi.fn(),
  })),
  mutate: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useNotificationPreferences', () => {
  it('should initialize with default preferences when no data is available', () => {
    const { result } = renderHook(() => useNotificationPreferences())

    expect(result.current.preferences).toEqual(expect.objectContaining({
      email_new_leads: true,
      email_appointment_reminders: true,
      email_deadline_alerts: true,
      sms_urgent_deadlines: true,
      inapp_all_notifications: true,
      email_frequency: 'immediate',
      sms_frequency: 'urgent_only',
    }))
  })

  it('should update preferences successfully', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          id: '1',
          email_new_leads: false,
          email_appointment_reminders: true,
        }
      }),
    })

    const { result } = renderHook(() => useNotificationPreferences())

    let updatedPreferences
    await act(async () => {
      updatedPreferences = await result.current.updatePreferences({
        email_new_leads: false
      })
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_new_leads: false
      }),
    })

    expect(updatedPreferences).toEqual(expect.objectContaining({
      email_new_leads: false
    }))
  })

  it('should handle API errors', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'API Error' }),
    })

    const { result } = renderHook(() => useNotificationPreferences())

    let response
    await act(async () => {
      response = await result.current.updatePreferences({
        email_new_leads: false
      })
    })

    expect(response).toBeNull()
    expect(result.current.error).toBe('API Error')
  })

  it('should toggle email notifications', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: { email_new_leads: false }
      }),
    })

    const { result } = renderHook(() => useNotificationPreferences())

    await act(async () => {
      await result.current.toggleEmailNotification('email_new_leads')
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_new_leads: false // Should be opposite of default true
      }),
    })
  })

  it('should toggle SMS notifications', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: { sms_urgent_deadlines: false }
      }),
    })

    const { result } = renderHook(() => useNotificationPreferences())

    await act(async () => {
      await result.current.toggleSMSNotification('sms_urgent_deadlines')
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sms_urgent_deadlines: false // Should be opposite of default true
      }),
    })
  })

  it('should update phone number', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: { phone_number: '+1234567890' }
      }),
    })

    const { result } = renderHook(() => useNotificationPreferences())

    await act(async () => {
      await result.current.updatePhoneNumber('+1234567890')
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: '+1234567890'
      }),
    })
  })

  it('should update email frequency', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: { email_frequency: 'daily' }
      }),
    })

    const { result } = renderHook(() => useNotificationPreferences())

    await act(async () => {
      await result.current.updateEmailFrequency('daily')
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_frequency: 'daily'
      }),
    })
  })

  it('should update quiet hours', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          quiet_hours_start: '23:00',
          quiet_hours_end: '07:00',
          quiet_hours_enabled: true
        }
      }),
    })

    const { result } = renderHook(() => useNotificationPreferences())

    await act(async () => {
      await result.current.updateQuietHours('23:00', '07:00', true)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quiet_hours_start: '23:00',
        quiet_hours_end: '07:00',
        quiet_hours_enabled: true
      }),
    })
  })

  it('should reset to defaults', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: {
          email_new_leads: true,
          email_frequency: 'immediate',
          // ... other default values
        }
      }),
    })

    const { result } = renderHook(() => useNotificationPreferences())

    await act(async () => {
      await result.current.resetToDefaults()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.stringContaining('"email_new_leads":true'),
    })
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useNotificationPreferences())

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})