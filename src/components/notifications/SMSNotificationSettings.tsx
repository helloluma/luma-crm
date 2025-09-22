'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Clock, AlertTriangle, Phone } from 'lucide-react'

interface SMSNotificationPreferences {
  urgentDeadlines: boolean
  appointmentReminders: boolean
  emergencyAlerts: boolean
  phoneNumber?: string
}

interface SMSNotificationSettingsProps {
  onSave?: (preferences: SMSNotificationPreferences) => void
  initialPreferences?: SMSNotificationPreferences
}

const defaultPreferences: SMSNotificationPreferences = {
  urgentDeadlines: true,
  appointmentReminders: true,
  emergencyAlerts: true,
  phoneNumber: '',
}

export function SMSNotificationSettings({ 
  onSave, 
  initialPreferences = defaultPreferences 
}: SMSNotificationSettingsProps) {
  const [preferences, setPreferences] = useState<SMSNotificationPreferences>(initialPreferences)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setPreferences(initialPreferences)
  }, [initialPreferences])

  const handleToggle = (key: keyof Omit<SMSNotificationPreferences, 'phoneNumber'>) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handlePhoneNumberChange = (phoneNumber: string) => {
    setPreferences(prev => ({
      ...prev,
      phoneNumber
    }))
  }

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return false
    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)

    // Validate phone number if SMS notifications are enabled
    const hasEnabledSMS = preferences.urgentDeadlines || preferences.appointmentReminders || preferences.emergencyAlerts
    
    if (hasEnabledSMS && !validatePhoneNumber(preferences.phoneNumber || '')) {
      setMessage({ type: 'error', text: 'Please enter a valid phone number to enable SMS notifications.' })
      setIsLoading(false)
      return
    }

    try {
      if (onSave) {
        await onSave(preferences)
      }
      
      // In a real implementation, you would save to the backend here
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setMessage({ type: 'success', text: 'SMS notification preferences saved successfully!' })
    } catch (error) {
      console.error('Failed to save SMS preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const notificationTypes = [
    {
      key: 'urgentDeadlines' as const,
      label: 'Urgent Deadlines',
      description: 'Get SMS alerts for critical deadlines within 24 hours',
      icon: AlertTriangle,
    },
    {
      key: 'appointmentReminders' as const,
      label: 'Appointment Reminders',
      description: 'Receive SMS reminders 1 hour before appointments',
      icon: Clock,
    },
    {
      key: 'emergencyAlerts' as const,
      label: 'Emergency Alerts',
      description: 'Critical system alerts and urgent client messages',
      icon: Phone,
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">SMS Notification Preferences</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Configure SMS alerts for urgent notifications
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

        {/* Phone Number Input */}
        <div className="mb-6">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              id="phoneNumber"
              value={preferences.phoneNumber || ''}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter your phone number with country code (e.g., +1 for US)
          </p>
        </div>

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

        {/* SMS Rates Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">SMS Rates Apply</h4>
              <p className="mt-1 text-sm text-yellow-700">
                Standard SMS rates from your mobile carrier may apply. SMS notifications are sent only for urgent alerts.
              </p>
            </div>
          </div>
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