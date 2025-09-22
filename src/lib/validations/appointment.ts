import { z } from 'zod'

// Appointment type enum
export const appointmentTypeSchema = z.enum(['Showing', 'Meeting', 'Call', 'Deadline'])

// Appointment status enum
export const appointmentStatusSchema = z.enum(['Scheduled', 'Completed', 'Cancelled'])

// Recurrence frequency enum
export const recurrenceFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])

// Base appointment schema
export const appointmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  client_id: z.string().uuid('Invalid client ID').optional(),
  start_time: z.string().datetime('Invalid start time format'),
  end_time: z.string().datetime('Invalid end time format'),
  location: z.string().max(255, 'Location must be less than 255 characters').optional(),
  type: appointmentTypeSchema.optional(),
  status: appointmentStatusSchema.optional(),
  is_recurring: z.boolean().optional(),
  recurrence_rule: z.string().optional(),
  recurrence_end_date: z.string().datetime('Invalid recurrence end date format').optional(),
  parent_appointment_id: z.string().uuid('Invalid parent appointment ID').optional(),
}).refine(
  (data) => new Date(data.start_time) < new Date(data.end_time),
  {
    message: 'End time must be after start time',
    path: ['end_time'],
  }
).refine(
  (data) => {
    if (data.is_recurring && !data.recurrence_rule) {
      return false
    }
    return true
  },
  {
    message: 'Recurrence rule is required for recurring appointments',
    path: ['recurrence_rule'],
  }
).refine(
  (data) => {
    if (data.recurrence_end_date && new Date(data.recurrence_end_date) <= new Date(data.start_time)) {
      return false
    }
    return true
  },
  {
    message: 'Recurrence end date must be after start time',
    path: ['recurrence_end_date'],
  }
)

// Create appointment schema (for POST requests)
export const createAppointmentSchema = appointmentSchema.omit({
  status: true, // Status defaults to 'Scheduled'
})

// Update appointment schema (for PUT/PATCH requests)
export const updateAppointmentSchema = appointmentSchema.partial().extend({
  id: z.string().uuid('Invalid appointment ID'),
})

// Query parameters schema for filtering appointments
export const appointmentQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  type: appointmentTypeSchema.optional(),
  status: appointmentStatusSchema.optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  is_recurring: z.boolean().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
})

// Recurring appointment pattern schema
export const recurringPatternSchema = z.object({
  frequency: recurrenceFrequencySchema,
  interval: z.number().min(1).max(365).optional(), // e.g., every 2 weeks
  byweekday: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
  bymonthday: z.array(z.number().min(1).max(31)).optional(),
  bymonth: z.array(z.number().min(1).max(12)).optional(),
  count: z.number().min(1).max(365).optional(), // number of occurrences
  until: z.string().datetime().optional(), // end date
})

// Helper function to generate RRULE string from pattern
export function generateRRule(pattern: z.infer<typeof recurringPatternSchema>): string {
  let rrule = `FREQ=${pattern.frequency}`
  
  if (pattern.interval && pattern.interval > 1) {
    rrule += `;INTERVAL=${pattern.interval}`
  }
  
  if (pattern.byweekday && pattern.byweekday.length > 0) {
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    const weekdays = pattern.byweekday.map(day => days[day]).join(',')
    rrule += `;BYDAY=${weekdays}`
  }
  
  if (pattern.bymonthday && pattern.bymonthday.length > 0) {
    rrule += `;BYMONTHDAY=${pattern.bymonthday.join(',')}`
  }
  
  if (pattern.bymonth && pattern.bymonth.length > 0) {
    rrule += `;BYMONTH=${pattern.bymonth.join(',')}`
  }
  
  if (pattern.count) {
    rrule += `;COUNT=${pattern.count}`
  }
  
  if (pattern.until) {
    const untilDate = new Date(pattern.until).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    rrule += `;UNTIL=${untilDate}`
  }
  
  return rrule
}

// Helper function to parse RRULE string to pattern
export function parseRRule(rrule: string): Partial<z.infer<typeof recurringPatternSchema>> {
  const pattern: Partial<z.infer<typeof recurringPatternSchema>> = {}
  const parts = rrule.split(';')
  
  for (const part of parts) {
    const [key, value] = part.split('=')
    
    switch (key) {
      case 'FREQ':
        pattern.frequency = value as z.infer<typeof recurrenceFrequencySchema>
        break
      case 'INTERVAL':
        pattern.interval = parseInt(value)
        break
      case 'BYDAY':
        const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
        pattern.byweekday = value.split(',').map(day => dayMap[day]).filter(day => day !== undefined)
        break
      case 'BYMONTHDAY':
        pattern.bymonthday = value.split(',').map(day => parseInt(day))
        break
      case 'BYMONTH':
        pattern.bymonth = value.split(',').map(month => parseInt(month))
        break
      case 'COUNT':
        pattern.count = parseInt(value)
        break
      case 'UNTIL':
        // Convert RRULE date format back to ISO string
        const year = value.substring(0, 4)
        const month = value.substring(4, 6)
        const day = value.substring(6, 8)
        const hour = value.substring(9, 11) || '00'
        const minute = value.substring(11, 13) || '00'
        const second = value.substring(13, 15) || '00'
        pattern.until = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
        break
    }
  }
  
  return pattern
}

export type AppointmentFormData = z.infer<typeof appointmentSchema>
export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>
export type RecurringPattern = z.infer<typeof recurringPatternSchema>