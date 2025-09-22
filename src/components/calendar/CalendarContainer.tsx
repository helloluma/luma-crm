'use client'

import React, { useState, useCallback } from 'react'
import { format } from 'date-fns'
import useSWR, { mutate } from 'swr'
import { Calendar as CalendarIcon, Plus, Grid3X3, List } from 'lucide-react'
import CalendarView from './CalendarView'
import AppointmentModal from './AppointmentModal'
import { AppointmentWithClient, AppointmentUpdate } from '@/types'

interface CalendarContainerProps {
  onCreateAppointment?: (date?: Date) => void
  onEditAppointment?: (appointment: AppointmentWithClient) => void
  className?: string
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch appointments')
  }
  return response.json()
}

export default function CalendarContainer({
  onCreateAppointment,
  onEditAppointment,
  className = ''
}: CalendarContainerProps) {
  const [view, setView] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithClient | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch appointments for the current month/week
  const startDate = format(selectedDate, 'yyyy-MM-01')
  const endDate = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), 'yyyy-MM-dd')
  
  const { data, error, isLoading } = useSWR(
    `/api/appointments?start_date=${startDate}&end_date=${endDate}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  const appointments: AppointmentWithClient[] = data?.data || []

  // Handle appointment click
  const handleAppointmentClick = useCallback((appointment: AppointmentWithClient) => {
    setSelectedAppointment(appointment)
    setIsModalOpen(true)
  }, [])

  // Handle date click
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date)
    onCreateAppointment?.(date)
  }, [onCreateAppointment])

  // Handle appointment drag and drop
  const handleAppointmentDrop = useCallback(async (appointmentId: string, newDate: Date, newTime: string) => {
    try {
      const appointment = appointments.find(a => a.id === appointmentId)
      if (!appointment) return

      const [hours, minutes] = newTime.split(':').map(Number)
      const newStartTime = new Date(newDate)
      newStartTime.setHours(hours, minutes, 0, 0)

      const originalDuration = new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()
      const newEndTime = new Date(newStartTime.getTime() + originalDuration)

      const updateData: AppointmentUpdate = {
        id: appointmentId,
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
      }

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to update appointment')
      }

      // Revalidate the appointments data
      mutate(`/api/appointments?start_date=${startDate}&end_date=${endDate}`)
    } catch (error) {
      console.error('Error updating appointment:', error)
      // You might want to show a toast notification here
    }
  }, [appointments, startDate, endDate])

  // Handle appointment deletion
  const handleDeleteAppointment = useCallback(async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete appointment')
      }

      // Revalidate the appointments data
      mutate(`/api/appointments?start_date=${startDate}&end_date=${endDate}`)
    } catch (error) {
      console.error('Error deleting appointment:', error)
      // You might want to show a toast notification here
    }
  }, [startDate, endDate])

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    setSelectedAppointment(null)
  }, [])

  // Handle edit appointment
  const handleEditAppointment = useCallback((appointment: AppointmentWithClient) => {
    onEditAppointment?.(appointment)
  }, [onEditAppointment])

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load calendar
          </h3>
          <p className="text-gray-500">
            There was an error loading your appointments. Please try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Calendar Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2" />
              Calendar
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  view === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4 mr-1 inline" />
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  view === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4 mr-1 inline" />
                Week
              </button>
            </div>

            {/* Create Appointment Button */}
            {onCreateAppointment && (
              <button
                onClick={() => onCreateAppointment()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <CalendarView
        appointments={appointments}
        onAppointmentClick={handleAppointmentClick}
        onDateClick={handleDateClick}
        onAppointmentDrop={handleAppointmentDrop}
        view={view}
        selectedDate={selectedDate}
        loading={isLoading}
      />

      {/* Appointment Modal */}
      <AppointmentModal
        appointment={selectedAppointment}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onEdit={handleEditAppointment}
        onDelete={handleDeleteAppointment}
      />
    </div>
  )
}