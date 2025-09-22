import { useState, useCallback } from 'react'

interface SMSRecipient {
  phoneNumber: string
  name?: string
  clientName?: string
  deadline?: string
  appointmentTime?: string
  location?: string
}

interface SendSMSNotificationParams {
  type: 'deadline' | 'appointment' | 'urgent' | 'custom'
  recipients: SMSRecipient[]
  title?: string
  message: string
}

interface SMSNotificationResult {
  success: boolean
  sent: number
  failed: number
  results: Array<{
    phoneNumber: string
    success: boolean
    messageId?: string
  }>
  errors?: Array<{
    phoneNumber: string
    error: string
  }>
}

export function useSMSNotifications() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendSMSNotification = useCallback(async (
    params: SendSMSNotificationParams
  ): Promise<SMSNotificationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send SMS notifications')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS notifications'
      setError(errorMessage)
      console.error('Error sending SMS notifications:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendDeadlineReminderSMS = useCallback(async (
    recipients: Array<SMSRecipient & { clientName: string; deadline: string }>,
    message: string
  ) => {
    return sendSMSNotification({
      type: 'deadline',
      recipients,
      message,
    })
  }, [sendSMSNotification])

  const sendAppointmentReminderSMS = useCallback(async (
    recipients: Array<SMSRecipient & { appointmentTime: string; clientName?: string; location?: string }>,
    appointmentTitle: string
  ) => {
    return sendSMSNotification({
      type: 'appointment',
      recipients,
      title: appointmentTitle,
      message: 'You have an upcoming appointment.',
    })
  }, [sendSMSNotification])

  const sendUrgentNotificationSMS = useCallback(async (
    recipients: SMSRecipient[],
    title: string,
    message: string
  ) => {
    return sendSMSNotification({
      type: 'urgent',
      recipients,
      title,
      message,
    })
  }, [sendSMSNotification])

  const sendCustomSMS = useCallback(async (
    recipients: SMSRecipient[],
    message: string
  ) => {
    return sendSMSNotification({
      type: 'custom',
      recipients,
      message,
    })
  }, [sendSMSNotification])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    sendSMSNotification,
    sendDeadlineReminderSMS,
    sendAppointmentReminderSMS,
    sendUrgentNotificationSMS,
    sendCustomSMS,
    clearError,
  }
}