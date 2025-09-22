import { useState, useCallback } from 'react'
import useSWR, { mutate } from 'swr'

export interface NotificationPreferences {
  id?: string
  user_id?: string
  
  // Email preferences
  email_new_leads: boolean
  email_appointment_reminders: boolean
  email_deadline_alerts: boolean
  email_transaction_updates: boolean
  email_client_messages: boolean
  email_system_notifications: boolean
  
  // SMS preferences
  sms_urgent_deadlines: boolean
  sms_appointment_reminders: boolean
  sms_emergency_alerts: boolean
  
  // In-app preferences
  inapp_all_notifications: boolean
  
  // Contact information
  phone_number?: string
  
  // Notification frequency settings
  email_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  sms_frequency: 'immediate' | 'urgent_only'
  
  // Quiet hours
  quiet_hours_start: string
  quiet_hours_end: string
  quiet_hours_enabled: boolean
  
  // Timezone
  timezone: string
  
  created_at?: string
  updated_at?: string
}

const defaultPreferences: NotificationPreferences = {
  email_new_leads: true,
  email_appointment_reminders: true,
  email_deadline_alerts: true,
  email_transaction_updates: true,
  email_client_messages: true,
  email_system_notifications: false,
  sms_urgent_deadlines: true,
  sms_appointment_reminders: true,
  sms_emergency_alerts: true,
  inapp_all_notifications: true,
  phone_number: '',
  email_frequency: 'immediate',
  sms_frequency: 'urgent_only',
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  quiet_hours_enabled: true,
  timezone: 'UTC',
}

const fetcher = async (url: string): Promise<{ data: NotificationPreferences }> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch notification preferences')
  }
  return response.json()
}

export function useNotificationPreferences() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, error: swrError, mutate: mutatePreferences } = useSWR<{ data: NotificationPreferences }>(
    '/api/notifications/preferences',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const preferences = data?.data || defaultPreferences

  const updatePreferences = useCallback(async (
    newPreferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update notification preferences')
      }

      // Update the cache
      mutatePreferences({ data: result.data }, false)
      
      // Also update the global cache
      mutate('/api/notifications/preferences', { data: result.data }, false)

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification preferences'
      setError(errorMessage)
      console.error('Error updating notification preferences:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [mutatePreferences])

  const resetToDefaults = useCallback(async () => {
    return updatePreferences(defaultPreferences)
  }, [updatePreferences])

  const toggleEmailNotification = useCallback(async (key: keyof Pick<NotificationPreferences, 
    'email_new_leads' | 'email_appointment_reminders' | 'email_deadline_alerts' | 
    'email_transaction_updates' | 'email_client_messages' | 'email_system_notifications'
  >) => {
    return updatePreferences({
      [key]: !preferences[key]
    })
  }, [preferences, updatePreferences])

  const toggleSMSNotification = useCallback(async (key: keyof Pick<NotificationPreferences,
    'sms_urgent_deadlines' | 'sms_appointment_reminders' | 'sms_emergency_alerts'
  >) => {
    return updatePreferences({
      [key]: !preferences[key]
    })
  }, [preferences, updatePreferences])

  const updatePhoneNumber = useCallback(async (phoneNumber: string) => {
    return updatePreferences({ phone_number: phoneNumber })
  }, [updatePreferences])

  const updateEmailFrequency = useCallback(async (frequency: NotificationPreferences['email_frequency']) => {
    return updatePreferences({ email_frequency: frequency })
  }, [updatePreferences])

  const updateSMSFrequency = useCallback(async (frequency: NotificationPreferences['sms_frequency']) => {
    return updatePreferences({ sms_frequency: frequency })
  }, [updatePreferences])

  const updateQuietHours = useCallback(async (
    start: string, 
    end: string, 
    enabled: boolean
  ) => {
    return updatePreferences({
      quiet_hours_start: start,
      quiet_hours_end: end,
      quiet_hours_enabled: enabled
    })
  }, [updatePreferences])

  const updateTimezone = useCallback(async (timezone: string) => {
    return updatePreferences({ timezone })
  }, [updatePreferences])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    preferences,
    isLoading: isLoading || (!data && !swrError),
    error: error || (swrError ? swrError.message : null),
    updatePreferences,
    resetToDefaults,
    toggleEmailNotification,
    toggleSMSNotification,
    updatePhoneNumber,
    updateEmailFrequency,
    updateSMSFrequency,
    updateQuietHours,
    updateTimezone,
    clearError,
    refresh: mutatePreferences,
  }
}