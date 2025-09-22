'use client'

import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from 'lucide-react'

interface PublicAppointment {
  id: string
  title: string
  start_time: string
  end_time: string
  type: string
  status: string
}

interface PublicCalendarViewProps {
  calendarId: string
}

export default function PublicCalendarView({ calendarId }: PublicCalendarViewProps) {
  const [appointments, setAppointments] = useState<PublicAppointment[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [calendarId])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/calendar/public/${calendarId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Calendar not found or no longer available')
        }
        throw new Error('Failed to load calendar')
      }

      const data = await response.json()
      setAppointments(data.appointments)
    } catch (error) {
      console.error('Error fetching public calendar:', error)
      setError(error instanceof Error ? error.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const navigatePrevious = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const navigateNext = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  // Get calendar dates for the month view
  const getCalendarDates = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const dates = []
    let day = calendarStart
    while (day <= calendarEnd) {
      dates.push(day)
      day = addDays(day, 1)
    }
    return dates
  }

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.start_time), date)
    )
  }

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'Showing':
        return 'bg-blue-100 text-blue-800'
      case 'Meeting':
        return 'bg-green-100 text-green-800'
      case 'Call':
        return 'bg-yellow-100 text-yellow-800'
      case 'Deadline':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Unavailable</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  const calendarDates = getCalendarDates()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={navigateToday}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            Today
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={navigatePrevious}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={navigateNext}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b border-gray-100">
              {day}
            </div>
          ))}
          
          {/* Calendar dates */}
          {calendarDates.map(date => {
            const dayAppointments = getAppointmentsForDate(date)
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isToday = isSameDay(date, new Date())
            
            return (
              <div
                key={date.toISOString()}
                className={`min-h-24 p-1 border border-gray-100 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(date, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map(appointment => (
                    <div
                      key={appointment.id}
                      className={`text-xs p-1 rounded ${getAppointmentTypeColor(appointment.type)}`}
                      title={`${appointment.title} - ${format(new Date(appointment.start_time), 'h:mm a')}`}
                    >
                      <div className="truncate font-medium">{appointment.title}</div>
                      <div className="truncate flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(appointment.start_time), 'h:mm a')}
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayAppointments.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 rounded mr-1"></div>
            <span className="text-gray-600">Showing</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
            <span className="text-gray-600">Meeting</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 rounded mr-1"></div>
            <span className="text-gray-600">Call</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 rounded mr-1"></div>
            <span className="text-gray-600">Deadline</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 text-center">
        <p className="text-xs text-gray-500">
          This calendar shows availability only. Contact directly to schedule appointments.
        </p>
      </div>
    </div>
  )
}