'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User } from 'lucide-react'
import { AppointmentWithClient } from '@/types'

interface CalendarViewProps {
  appointments: AppointmentWithClient[]
  onAppointmentClick?: (appointment: AppointmentWithClient) => void
  onDateClick?: (date: Date) => void
  onAppointmentDrop?: (appointmentId: string, newDate: Date, newTime: string) => void
  view?: 'month' | 'week'
  selectedDate?: Date
  loading?: boolean
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  appointment: AppointmentWithClient
  color: string
}

const APPOINTMENT_COLORS = {
  Showing: 'bg-blue-500',
  Meeting: 'bg-green-500',
  Call: 'bg-yellow-500',
  Deadline: 'bg-red-500',
} as const

export default function CalendarView({
  appointments,
  onAppointmentClick,
  onDateClick,
  onAppointmentDrop,
  view = 'month',
  selectedDate = new Date(),
  loading = false
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)

  // Convert appointments to calendar events
  const events = useMemo(() => {
    return appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      start: new Date(appointment.start_time),
      end: new Date(appointment.end_time),
      appointment,
      color: APPOINTMENT_COLORS[appointment.type as keyof typeof APPOINTMENT_COLORS] || 'bg-gray-500'
    }))
  }, [appointments])

  // Navigation handlers
  const navigatePrevious = useCallback(() => {
    setCurrentDate(prev => view === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1))
  }, [view])

  const navigateNext = useCallback(() => {
    setCurrentDate(prev => view === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1))
  }, [view])

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Get calendar dates based on view
  const calendarDates = useMemo(() => {
    if (view === 'month') {
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
    } else {
      const weekStart = startOfWeek(currentDate)
      const dates = []
      for (let i = 0; i < 7; i++) {
        dates.push(addDays(weekStart, i))
      }
      return dates
    }
  }, [currentDate, view])

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => isSameDay(event.start, date))
  }, [events])

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault()
    if (draggedEvent && onAppointmentDrop) {
      const originalStart = draggedEvent.start
      const timeDiff = originalStart.getHours() * 60 + originalStart.getMinutes()
      const newTime = `${Math.floor(timeDiff / 60).toString().padStart(2, '0')}:${(timeDiff % 60).toString().padStart(2, '0')}`
      onAppointmentDrop(draggedEvent.id, date, newTime)
    }
    setDraggedEvent(null)
  }, [draggedEvent, onAppointmentDrop])

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null)
  }, [])

  // Format header based on view
  const formatHeader = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy')
    } else {
      const weekStart = startOfWeek(currentDate)
      const weekEnd = endOfWeek(currentDate)
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {formatHeader()}
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
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={navigateNext}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {view === 'month' ? (
          <MonthView
            dates={calendarDates}
            currentDate={currentDate}
            events={events}
            getEventsForDate={getEventsForDate}
            onDateClick={onDateClick}
            onAppointmentClick={onAppointmentClick}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ) : (
          <WeekView
            dates={calendarDates}
            currentDate={currentDate}
            events={events}
            getEventsForDate={getEventsForDate}
            onDateClick={onDateClick}
            onAppointmentClick={onAppointmentClick}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        )}
      </div>
    </div>
  )
}

// Month View Component
interface MonthViewProps {
  dates: Date[]
  currentDate: Date
  events: CalendarEvent[]
  getEventsForDate: (date: Date) => CalendarEvent[]
  onDateClick?: (date: Date) => void
  onAppointmentClick?: (appointment: AppointmentWithClient) => void
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, date: Date) => void
  onDragEnd: () => void
}

function MonthView({
  dates,
  currentDate,
  events,
  getEventsForDate,
  onDateClick,
  onAppointmentClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: MonthViewProps) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Week day headers */}
      {weekDays.map(day => (
        <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b border-gray-100">
          {day}
        </div>
      ))}
      
      {/* Calendar dates */}
      {dates.map(date => {
        const dayEvents = getEventsForDate(date)
        const isCurrentMonth = isSameMonth(date, currentDate)
        const isToday = isSameDay(date, new Date())
        
        return (
          <div
            key={date.toISOString()}
            className={`min-h-24 p-1 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
            }`}
            onClick={() => onDateClick?.(date)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, date)}
          >
            <div className={`text-sm font-medium mb-1 ${
              isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {format(date, 'd')}
            </div>
            
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 transition-opacity ${event.color}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, event)}
                  onDragEnd={onDragEnd}
                  onClick={(e) => {
                    e.stopPropagation()
                    onAppointmentClick?.(event.appointment)
                  }}
                  title={`${event.title} - ${format(event.start, 'h:mm a')}`}
                >
                  <div className="truncate">{event.title}</div>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 px-1">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Week View Component
interface WeekViewProps {
  dates: Date[]
  currentDate: Date
  events: CalendarEvent[]
  getEventsForDate: (date: Date) => CalendarEvent[]
  onDateClick?: (date: Date) => void
  onAppointmentClick?: (appointment: AppointmentWithClient) => void
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, date: Date) => void
  onDragEnd: () => void
}

function WeekView({
  dates,
  currentDate,
  events,
  getEventsForDate,
  onDateClick,
  onAppointmentClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: WeekViewProps) {
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="grid grid-cols-8 gap-1">
      {/* Time column header */}
      <div className="p-2 text-center text-sm font-medium text-gray-500 border-b border-gray-100">
        Time
      </div>
      
      {/* Date headers */}
      {dates.map(date => {
        const isToday = isSameDay(date, new Date())
        return (
          <div
            key={date.toISOString()}
            className={`p-2 text-center text-sm font-medium border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
              isToday ? 'text-blue-600 bg-blue-50' : 'text-gray-900'
            }`}
            onClick={() => onDateClick?.(date)}
          >
            <div>{format(date, 'EEE')}</div>
            <div className={`text-lg ${isToday ? 'font-bold' : ''}`}>
              {format(date, 'd')}
            </div>
          </div>
        )
      })}
      
      {/* Time slots */}
      {timeSlots.map(hour => (
        <React.Fragment key={hour}>
          {/* Time label */}
          <div className="p-2 text-xs text-gray-500 border-r border-gray-100">
            {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
          </div>
          
          {/* Day columns */}
          {dates.map(date => {
            const dayEvents = getEventsForDate(date).filter(event => 
              event.start.getHours() === hour
            )
            
            return (
              <div
                key={`${date.toISOString()}-${hour}`}
                className="min-h-12 p-1 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors relative"
                onClick={() => onDateClick?.(date)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, date)}
              >
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`absolute inset-x-1 text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 transition-opacity ${event.color}`}
                    style={{
                      top: `${(event.start.getMinutes() / 60) * 100}%`,
                      height: `${((event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)) * 100}%`
                    }}
                    draggable
                    onDragStart={(e) => onDragStart(e, event)}
                    onDragEnd={onDragEnd}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAppointmentClick?.(event.appointment)
                    }}
                    title={`${event.title} - ${format(event.start, 'h:mm a')} to ${format(event.end, 'h:mm a')}`}
                  >
                    <div className="truncate font-medium">{event.title}</div>
                    <div className="truncate opacity-90">
                      {format(event.start, 'h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </React.Fragment>
      ))}
    </div>
  )
}