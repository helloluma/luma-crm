import { useState, useCallback } from 'react'
import { NotificationType } from '@/types'

interface EmailRecipient {
  email: string
  name?: string
  notificationType?: NotificationType
  clientName?: string
  deadline?: string
  appointmentTime?: string
  location?: string
}

interface SendEmailNotificationParams {
  type: 'notification' | 'deadline' | 'appointment'
  recipients: EmailRecipient[]
  title: string
  message: string
  actionUrl?: string
}

interface EmailNotificationResult {
  success: boolean
  sent: number
  failed: number
  results: Array<{
    email: string
    success: boolean
    id?: string
  }>
  errors?: Array<{
    email: string
    error: string
  }>
}

export function useEmailNotifications() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendEmailNotification = useCallback(async (
    params: SendEmailNotificationParams
  ): Promise<EmailNotificationResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email notifications')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email notifications'
      setError(errorMessage)
      console.error('Error sending email notifications:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendNotificationEmail = useCallback(async (
    recipients: EmailRecipient[],
    title: string,
    message: string,
    actionUrl?: string
  ) => {
    return sendEmailNotification({
      type: 'notification',
      recipients,
      title,
      message,
      actionUrl,
    })
  }, [sendEmailNotification])

  const sendDeadlineReminderEmail = useCallback(async (
    recipients: Array<EmailRecipient & { clientName: string; deadline: string }>,
    message: string,
    actionUrl?: string
  ) => {
    return sendEmailNotification({
      type: 'deadline',
      recipients,
      title: 'Deadline Reminder',
      message,
      actionUrl,
    })
  }, [sendEmailNotification])

  const sendAppointmentReminderEmail = useCallback(async (
    recipients: Array<EmailRecipient & { appointmentTime: string; clientName?: string; location?: string }>,
    appointmentTitle: string,
    actionUrl?: string
  ) => {
    return sendEmailNotification({
      type: 'appointment',
      recipients,
      title: appointmentTitle,
      message: 'You have an upcoming appointment.',
      actionUrl,
    })
  }, [sendEmailNotification])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    sendEmailNotification,
    sendNotificationEmail,
    sendDeadlineReminderEmail,
    sendAppointmentReminderEmail,
    clearError,
  }
}