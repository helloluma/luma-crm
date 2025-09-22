'use client'

import React, { useState } from 'react'
import { CalendarContainer } from '@/components/calendar'
import CalendarIntegration from '@/components/calendar/CalendarIntegration'
import { Settings } from 'lucide-react'

export default function CalendarPage() {
  const [showIntegration, setShowIntegration] = useState(false)

  const handleCreateAppointment = (date?: Date) => {
    console.log('Create appointment for date:', date)
    // This would typically open a form modal or navigate to a form page
  }

  const handleEditAppointment = (appointment: any) => {
    console.log('Edit appointment:', appointment)
    // This would typically open an edit form modal
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <button
            onClick={() => setShowIntegration(!showIntegration)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            {showIntegration ? 'Hide' : 'Show'} Integration Settings
          </button>
        </div>

        {showIntegration && (
          <div className="mb-6">
            <CalendarIntegration />
          </div>
        )}

        <CalendarContainer
          onCreateAppointment={handleCreateAppointment}
          onEditAppointment={handleEditAppointment}
          className="w-full"
        />
      </div>
    </div>
  )
}