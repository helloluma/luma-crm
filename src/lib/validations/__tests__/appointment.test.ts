import { describe, it, expect } from 'vitest'
import {
  appointmentSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentQuerySchema,
  recurringPatternSchema,
  generateRRule,
  parseRRule,
} from '../appointment'

describe('Appointment Validation', () => {
  describe('appointmentSchema', () => {
    it('should validate a basic appointment', () => {
      const validAppointment = {
        title: 'Client Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
      }

      const result = appointmentSchema.safeParse(validAppointment)
      expect(result.success).toBe(true)
    })

    it('should validate a complete appointment with all fields', () => {
      const validAppointment = {
        title: 'Property Showing',
        description: 'Show the downtown condo to the Johnson family',
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        location: '123 Main St, Downtown',
        type: 'Showing' as const,
        status: 'Scheduled' as const,
        is_recurring: false,
      }

      const result = appointmentSchema.safeParse(validAppointment)
      expect(result.success).toBe(true)
    })

    it('should validate a recurring appointment', () => {
      const validRecurringAppointment = {
        title: 'Weekly Team Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO',
        recurrence_end_date: '2024-12-31T23:59:59Z',
      }

      const result = appointmentSchema.safeParse(validRecurringAppointment)
      expect(result.success).toBe(true)
    })

    it('should reject appointment with end time before start time', () => {
      const invalidAppointment = {
        title: 'Invalid Meeting',
        start_time: '2024-01-15T11:00:00Z',
        end_time: '2024-01-15T10:00:00Z',
      }

      const result = appointmentSchema.safeParse(invalidAppointment)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toEqual(['end_time'])
    })

    it('should reject recurring appointment without recurrence rule', () => {
      const invalidRecurringAppointment = {
        title: 'Invalid Recurring Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        is_recurring: true,
      }

      const result = appointmentSchema.safeParse(invalidRecurringAppointment)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toEqual(['recurrence_rule'])
    })

    it('should reject appointment with recurrence end date before start time', () => {
      const invalidAppointment = {
        title: 'Invalid Recurring Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY',
        recurrence_end_date: '2024-01-14T10:00:00Z',
      }

      const result = appointmentSchema.safeParse(invalidAppointment)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toEqual(['recurrence_end_date'])
    })

    it('should reject appointment with invalid title', () => {
      const invalidAppointment = {
        title: '',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
      }

      const result = appointmentSchema.safeParse(invalidAppointment)
      expect(result.success).toBe(false)
    })

    it('should reject appointment with invalid client ID', () => {
      const invalidAppointment = {
        title: 'Client Meeting',
        client_id: 'invalid-uuid',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
      }

      const result = appointmentSchema.safeParse(invalidAppointment)
      expect(result.success).toBe(false)
    })

    it('should reject appointment with invalid type', () => {
      const invalidAppointment = {
        title: 'Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        type: 'InvalidType',
      }

      const result = appointmentSchema.safeParse(invalidAppointment)
      expect(result.success).toBe(false)
    })
  })

  describe('createAppointmentSchema', () => {
    it('should validate appointment creation data', () => {
      const validData = {
        title: 'New Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
      }

      const result = createAppointmentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should not include status in creation schema', () => {
      const dataWithStatus = {
        title: 'New Meeting',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        status: 'Completed',
      }

      const result = createAppointmentSchema.safeParse(dataWithStatus)
      expect(result.success).toBe(true)
      expect(result.data?.status).toBeUndefined()
    })
  })

  describe('updateAppointmentSchema', () => {
    it('should validate appointment update data', () => {
      const validUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Updated Meeting',
      }

      const result = updateAppointmentSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('should require valid UUID for id', () => {
      const invalidUpdate = {
        id: 'invalid-uuid',
        title: 'Updated Meeting',
      }

      const result = updateAppointmentSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })

    it('should allow partial updates', () => {
      const partialUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'Completed' as const,
      }

      const result = updateAppointmentSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe('appointmentQuerySchema', () => {
    it('should validate query parameters', () => {
      const validQuery = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'Meeting',
        status: 'Scheduled',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        page: '1',
        limit: '20',
      }

      const result = appointmentQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
      expect(result.data?.page).toBe(1)
      expect(result.data?.limit).toBe(20)
    })

    it('should handle boolean conversion for is_recurring', () => {
      const queryWithBoolean = {
        is_recurring: true,
      }

      const result = appointmentQuerySchema.safeParse(queryWithBoolean)
      expect(result.success).toBe(true)
      expect(result.data?.is_recurring).toBe(true)
    })

    it('should reject invalid page numbers', () => {
      const invalidQuery = {
        page: '0',
      }

      const result = appointmentQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })

    it('should reject invalid limit numbers', () => {
      const invalidQuery = {
        limit: '101',
      }

      const result = appointmentQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })
  })

  describe('recurringPatternSchema', () => {
    it('should validate a basic weekly pattern', () => {
      const validPattern = {
        frequency: 'WEEKLY' as const,
        byweekday: [1, 3, 5], // Monday, Wednesday, Friday
      }

      const result = recurringPatternSchema.safeParse(validPattern)
      expect(result.success).toBe(true)
    })

    it('should validate a monthly pattern', () => {
      const validPattern = {
        frequency: 'MONTHLY' as const,
        bymonthday: [15],
        count: 12,
      }

      const result = recurringPatternSchema.safeParse(validPattern)
      expect(result.success).toBe(true)
    })

    it('should validate a yearly pattern', () => {
      const validPattern = {
        frequency: 'YEARLY' as const,
        bymonth: [1, 6, 12],
        until: '2025-12-31T23:59:59Z',
      }

      const result = recurringPatternSchema.safeParse(validPattern)
      expect(result.success).toBe(true)
    })

    it('should reject invalid frequency', () => {
      const invalidPattern = {
        frequency: 'INVALID' as any,
      }

      const result = recurringPatternSchema.safeParse(invalidPattern)
      expect(result.success).toBe(false)
    })

    it('should reject invalid weekday', () => {
      const invalidPattern = {
        frequency: 'WEEKLY' as const,
        byweekday: [7], // Invalid weekday (should be 0-6)
      }

      const result = recurringPatternSchema.safeParse(invalidPattern)
      expect(result.success).toBe(false)
    })
  })

  describe('generateRRule', () => {
    it('should generate basic weekly RRULE', () => {
      const pattern = {
        frequency: 'WEEKLY' as const,
        byweekday: [1, 3, 5],
      }

      const rrule = generateRRule(pattern)
      expect(rrule).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR')
    })

    it('should generate RRULE with interval', () => {
      const pattern = {
        frequency: 'WEEKLY' as const,
        interval: 2,
        byweekday: [1],
      }

      const rrule = generateRRule(pattern)
      expect(rrule).toBe('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO')
    })

    it('should generate RRULE with count', () => {
      const pattern = {
        frequency: 'DAILY' as const,
        count: 10,
      }

      const rrule = generateRRule(pattern)
      expect(rrule).toBe('FREQ=DAILY;COUNT=10')
    })

    it('should generate RRULE with until date', () => {
      const pattern = {
        frequency: 'MONTHLY' as const,
        until: '2024-12-31T23:59:59Z',
      }

      const rrule = generateRRule(pattern)
      expect(rrule).toBe('FREQ=MONTHLY;UNTIL=20241231T235959Z')
    })

    it('should generate complex RRULE', () => {
      const pattern = {
        frequency: 'MONTHLY' as const,
        interval: 2,
        bymonthday: [15],
        bymonth: [1, 3, 5, 7, 9, 11],
        count: 6,
      }

      const rrule = generateRRule(pattern)
      expect(rrule).toBe('FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=15;BYMONTH=1,3,5,7,9,11;COUNT=6')
    })
  })

  describe('parseRRule', () => {
    it('should parse basic weekly RRULE', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,WE,FR'
      const pattern = parseRRule(rrule)

      expect(pattern.frequency).toBe('WEEKLY')
      expect(pattern.byweekday).toEqual([1, 3, 5])
    })

    it('should parse RRULE with interval', () => {
      const rrule = 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO'
      const pattern = parseRRule(rrule)

      expect(pattern.frequency).toBe('WEEKLY')
      expect(pattern.interval).toBe(2)
      expect(pattern.byweekday).toEqual([1])
    })

    it('should parse RRULE with count', () => {
      const rrule = 'FREQ=DAILY;COUNT=10'
      const pattern = parseRRule(rrule)

      expect(pattern.frequency).toBe('DAILY')
      expect(pattern.count).toBe(10)
    })

    it('should parse RRULE with until date', () => {
      const rrule = 'FREQ=MONTHLY;UNTIL=20241231T235959Z'
      const pattern = parseRRule(rrule)

      expect(pattern.frequency).toBe('MONTHLY')
      expect(pattern.until).toBe('2024-12-31T23:59:59Z')
    })

    it('should parse complex RRULE', () => {
      const rrule = 'FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=15;BYMONTH=1,3,5;COUNT=6'
      const pattern = parseRRule(rrule)

      expect(pattern.frequency).toBe('MONTHLY')
      expect(pattern.interval).toBe(2)
      expect(pattern.bymonthday).toEqual([15])
      expect(pattern.bymonth).toEqual([1, 3, 5])
      expect(pattern.count).toBe(6)
    })
  })

  describe('RRULE round-trip', () => {
    it('should maintain data integrity in generate/parse cycle', () => {
      const originalPattern = {
        frequency: 'WEEKLY' as const,
        interval: 2,
        byweekday: [1, 3, 5],
        count: 20,
      }

      const rrule = generateRRule(originalPattern)
      const parsedPattern = parseRRule(rrule)

      expect(parsedPattern.frequency).toBe(originalPattern.frequency)
      expect(parsedPattern.interval).toBe(originalPattern.interval)
      expect(parsedPattern.byweekday).toEqual(originalPattern.byweekday)
      expect(parsedPattern.count).toBe(originalPattern.count)
    })
  })
})