'use client'

import { useState, useEffect } from 'react'
import { Mail, Bell, Clock, AlertTriangle } from 'lucide-react'

interface EmailNotificationPreferences {
  newLeads: boolean
  appointmentReminders: boolean
  deadlineAlerts: boolean
  transactionUpdates: boolean
  clientMessages: boolean
  systemNotifications: boolean
}

interface EmailNotificationSettingsProps {
  onSave?: (preferences: EmailNotificationPreferences) => void
  initialPreferences?: EmailNotificationPreferences
}

const defaultPreferences: EmailNotificationPreferences = {
  newLeads: true,
  appointmentReminders: true,
  deadlineAlerts: true,
  transactionUpdates: true,
  clientMessages: true,
  systemNotifications: false,
}

export function EmailNotificationSettings({ 
  onSave, 
  initialPreferences = defaultPreferences 
}: EmailNotificationSettingsProps) {
  const [preferences, setPreferences] = useState<EmailNotificationPreferences>(initialPreferences)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setPreferences(initialPreferences)
  }, [initialPreferences])

  const handleToggle = (key: keyof EmailNotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      if (onSave) {
        await onSave(preferences)
      }
      
      // In a real implementation, you would save to the backend here
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setMessage({ type: 'success', text: 'Email notification preferences saved successfully!' })
    } catch (error) {
      console.error('Failed to save email preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const notificationTypes = [
    {
      key: 'newLeads' as const,
      label: 'New Leads',
      description: 'Get notified when new leads are added to your CRM',
      icon: Bell,
    },
    {
      key: 'appointmentReminders' as const,
      label: 'Appointment Reminders',
      description: 'Receive reminders before scheduled appointments',
      icon: Clock,
    },
    {
      key: 'deadlineAlerts' as const,
      label: 'Deadline Alerts',
      description: 'Get alerts for upcoming client deadlines',
      icon: AlertTriangle,
    },
    {
      key: 'transactionUpdates' as const,
      label: 'Transaction Updates',
      description: 'Notifications about transaction status changes',
      icon: Mail,
    },
    {
      key: 'clientMessages' as const,
      label: 'Client Messages',
      description: 'Notifications when clients send messages',
      icon: Mail,
    },
    {
      key: 'systemNotifications' as const,
      label: 'System Notifications',
      description: 'System updates and maintenance notifications',
      icon: Bell,
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Email Notification Preferences</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Choose which email notifications you'd like to receive
        </p>
      </div>

      <div className="p-6">
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {notificationTypes.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <Icon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <button
                      type="button"
                      onClick={() => handleToggle(key)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences[key] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences[key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}