import React from 'react'
import PublicCalendarView from '@/components/calendar/PublicCalendarView'

interface PublicCalendarPageProps {
  params: {
    id: string
  }
}

export default function PublicCalendarPage({ params }: PublicCalendarPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Calendar Availability</h1>
          <p className="mt-2 text-gray-600">
            View available appointment times and scheduled events
          </p>
        </div>
        
        <PublicCalendarView calendarId={params.id} />
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PublicCalendarPageProps) {
  return {
    title: 'Calendar Availability - Real Estate CRM',
    description: 'View available appointment times and scheduled events',
    robots: 'noindex, nofollow' // Prevent search engine indexing for privacy
  }
}