'use client'

import { useState } from 'react'
import { Settings, Mail, Smartphone, Bell, Clock, Globe, RotateCcw } from 'lucide-react'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'
import { EmailNotificationSettings } from './EmailNotificationSettings'
import { SMSNotificationSettings } from './SMSNotificationSettings'

interface NotificationPreferencesManagerProps {
  className?: string
}

export function NotificationPreferencesManager({ className = '' }: NotificationPreferencesManagerProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'inapp' | 'schedule'>('email')
  const {
    preferences,
    isLoading,
    error,
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
  } = useNotificationPreferences()

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async (newPreferences: any) => {
    try {
      await updatePreferences(newPreferences)
      setMessage({ type: 'success', text: 'Notification preferences saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all notification preferences to defaults?')) {
      try {
        await resetToDefaults()
        setMessage({ type: 'success', text: 'Notification preferences reset to defaults!' })
        setTimeout(() => setMessage(null), 3000)
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to reset preferences. Please try again.' })
        setTimeout(() => setMessage(null), 3000)
      }
    }
  }

  const tabs = [
    { id: 'email' as const, label: 'Email', icon: Mail },
    { id: 'sms' as const, label: 'SMS', icon: Smartphone },
    { id: 'inapp' as const, label: 'In-App', icon: Bell },
    { id: 'schedule' as const, label: 'Schedule', icon: Clock },
  ]

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Global Messages */}
      {message && (
        <div className={`mx-6 mt-4 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 p-4 rounded-md bg-red-50 text-red-800 border border-red-200">
          {error}
          <button
            onClick={clearError}
            className="ml-2 text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'email' && (
          <EmailNotificationSettings
            onSave={handleSave}
            initialPreferences={{
              newLeads: preferences.email_new_leads,
              appointmentReminders: preferences.email_appointment_reminders,
              deadlineAlerts: preferences.email_deadline_alerts,
              transactionUpdates: preferences.email_transaction_updates,
              clientMessages: preferences.email_client_messages,
              systemNotifications: preferences.email_system_notifications,
            }}
          />
        )}

        {activeTab === 'sms' && (
          <SMSNotificationSettings
            onSave={handleSave}
            initialPreferences={{
              urgentDeadlines: preferences.sms_urgent_deadlines,
              appointmentReminders: preferences.sms_appointment_reminders,
              emergencyAlerts: preferences.sms_emergency_alerts,
              phoneNumber: preferences.phone_number,
            }}
          />
        )}

        {activeTab === 'inapp' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">All In-App Notifications</h4>
                <p className="text-sm text-gray-600">
                  Enable or disable all in-app notifications
                </p>
              </div>
              <button
                type="button"
                onClick={() => updatePreferences({ inapp_all_notifications: !preferences.inapp_all_notifications })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  preferences.inapp_all_notifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    preferences.inapp_all_notifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex">
                <Bell className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">In-App Notifications</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    In-app notifications appear in the notification center and show real-time updates 
                    while you're using the application.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Email Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Notification Frequency
              </label>
              <select
                value={preferences.email_frequency}
                onChange={(e) => updateEmailFrequency(e.target.value as any)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                How often you want to receive email notifications
              </p>
            </div>

            {/* SMS Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMS Notification Frequency
              </label>
              <select
                value={preferences.sms_frequency}
                onChange={(e) => updateSMSFrequency(e.target.value as any)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="immediate">Immediate</option>
                <option value="urgent_only">Urgent Only</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                SMS notifications are typically reserved for urgent alerts
              </p>
            </div>

            {/* Quiet Hours */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Quiet Hours</h4>
                  <p className="text-sm text-gray-600">
                    Disable notifications during specific hours
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateQuietHours(
                    preferences.quiet_hours_start,
                    preferences.quiet_hours_end,
                    !preferences.quiet_hours_enabled
                  )}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    preferences.quiet_hours_enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.quiet_hours_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => updateQuietHours(
                        e.target.value,
                        preferences.quiet_hours_end,
                        preferences.quiet_hours_enabled
                      )}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => updateQuietHours(
                        preferences.quiet_hours_start,
                        e.target.value,
                        preferences.quiet_hours_enabled
                      )}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => updateTimezone(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Used for scheduling notifications and quiet hours
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}