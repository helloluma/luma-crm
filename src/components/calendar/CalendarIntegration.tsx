'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, ExternalLink, Sync, Share2, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface CalendarIntegration {
  id: string
  user_id: string
  provider: 'google' | 'outlook'
  calendar_name: string
  sync_enabled: boolean
  last_sync: string | null
  created_at: string
}

interface SyncResults {
  imported: number
  exported: number
  errors: string[]
}

export default function CalendarIntegration() {
  const [integrations, setIntegrations] = useState<{
    google: CalendarIntegration | null
    outlook: CalendarIntegration | null
  }>({ google: null, outlook: null })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncResults, setSyncResults] = useState<SyncResults | null>(null)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/calendar/integrations')
      
      if (!response.ok) {
        throw new Error('Failed to fetch integrations')
      }

      const data = await response.json()
      setIntegrations(data.integrations)
    } catch (error) {
      console.error('Error fetching integrations:', error)
      setError('Failed to load calendar integrations')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleConnect = async () => {
    try {
      const response = await fetch('/api/calendar/google/auth')
      
      if (!response.ok) {
        throw new Error('Failed to get authorization URL')
      }

      const data = await response.json()
      window.location.href = data.authUrl
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error)
      setError('Failed to connect to Google Calendar')
    }
  }

  const handleSync = async (provider: 'google' | 'outlook') => {
    try {
      setSyncing(provider)
      setSyncResults(null)
      setError(null)

      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider })
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const data = await response.json()
      setSyncResults(data.results)
      
      // Refresh integrations to update last sync time
      await fetchIntegrations()
    } catch (error) {
      console.error('Error syncing calendar:', error)
      setError(`Failed to sync with ${provider} Calendar`)
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (provider: 'google' | 'outlook') => {
    if (!confirm(`Are you sure you want to disconnect ${provider} Calendar?`)) {
      return
    }

    try {
      const response = await fetch(`/api/calendar/integrations?provider=${provider}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      await fetchIntegrations()
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      setError(`Failed to disconnect ${provider} Calendar`)
    }
  }

  const handleCreatePublicCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/public', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to create public calendar')
      }

      const data = await response.json()
      setPublicUrl(data.publicUrl)
    } catch (error) {
      console.error('Error creating public calendar:', error)
      setError('Failed to create public calendar')
    }
  }

  const copyPublicUrl = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl)
      // You could add a toast notification here
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Calendar Integration
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {syncResults && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-sm font-medium text-green-700">Sync Completed</span>
          </div>
          <div className="text-sm text-green-600">
            <p>Imported: {syncResults.imported} events</p>
            <p>Exported: {syncResults.exported} appointments</p>
            {syncResults.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Errors:</p>
                <ul className="list-disc list-inside">
                  {syncResults.errors.map((error, index) => (
                    <li key={index} className="text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Google Calendar Integration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Google Calendar</h4>
                {integrations.google ? (
                  <div className="text-sm text-gray-500">
                    <p>Connected: {integrations.google.calendar_name}</p>
                    {integrations.google.last_sync && (
                      <p className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Last sync: {new Date(integrations.google.last_sync).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not connected</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {integrations.google ? (
                <>
                  <button
                    onClick={() => handleSync('google')}
                    disabled={syncing === 'google'}
                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 flex items-center"
                  >
                    <Sync className={`h-4 w-4 mr-1 ${syncing === 'google' ? 'animate-spin' : ''}`} />
                    {syncing === 'google' ? 'Syncing...' : 'Sync'}
                  </button>
                  <button
                    onClick={() => handleDisconnect('google')}
                    className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGoogleConnect}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Outlook Calendar Integration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Outlook Calendar</h4>
                {integrations.outlook ? (
                  <div className="text-sm text-gray-500">
                    <p>Connected: {integrations.outlook.calendar_name}</p>
                    {integrations.outlook.last_sync && (
                      <p className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Last sync: {new Date(integrations.outlook.last_sync).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not connected (Coming Soon)</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {integrations.outlook ? (
                <>
                  <button
                    onClick={() => handleSync('outlook')}
                    disabled={syncing === 'outlook'}
                    className="px-3 py-1 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50 flex items-center"
                  >
                    <Sync className={`h-4 w-4 mr-1 ${syncing === 'outlook' ? 'animate-spin' : ''}`} />
                    {syncing === 'outlook' ? 'Syncing...' : 'Sync'}
                  </button>
                  <button
                    onClick={() => handleDisconnect('outlook')}
                    className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Public Calendar Sharing */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Share2 className="h-4 w-4 mr-2" />
          Public Calendar Sharing
        </h4>
        
        {publicUrl ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Your public calendar URL:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={publicUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
              />
              <button
                onClick={copyPublicUrl}
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This URL shows your availability without revealing private details.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Create a public calendar URL to share your availability with clients.
            </p>
            <button
              onClick={handleCreatePublicCalendar}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex items-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Create Public Calendar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}