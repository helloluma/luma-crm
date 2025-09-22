import { vi, beforeEach, describe, it, expect } from 'vitest'
import { smsService, formatPhoneNumber, validatePhoneNumber } from '../sms'

// Mock AWS SDK
vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  PublishCommand: vi.fn(),
}))

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  vi.clearAllMocks()
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = originalEnv
})

describe('smsService', () => {
  describe('sendDeadlineReminderSMS', () => {
    it('should log SMS in development mode', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await smsService.sendDeadlineReminderSMS({
        phoneNumber: '+1234567890',
        userName: 'Test User',
        clientName: 'John Doe',
        deadline: '2024-01-15',
        description: 'Contract signing deadline'
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('dev-mode-id')
      expect(consoleSpy).toHaveBeenCalledWith(
        '📱 Deadline reminder SMS (dev mode):',
        expect.objectContaining({
          to: '+1234567890',
          clientName: 'John Doe',
          deadline: '2024-01-15'
        })
      )

      consoleSpy.mockRestore()
    })

    it('should handle errors gracefully', async () => {
      process.env.NODE_ENV = 'development'
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Console error')
      })

      const result = await smsService.sendDeadlineReminderSMS({
        phoneNumber: '+1234567890',
        userName: 'Test User',
        clientName: 'John Doe',
        deadline: '2024-01-15',
        description: 'Contract signing deadline'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Console error')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      consoleLogSpy.mockRestore()
    })
  })

  describe('sendAppointmentReminderSMS', () => {
    it('should log SMS in development mode', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await smsService.sendAppointmentReminderSMS({
        phoneNumber: '+1234567890',
        userName: 'Test User',
        appointmentTitle: 'Property Showing',
        appointmentTime: '2024-01-15 10:00 AM',
        location: '123 Main St',
        clientName: 'Jane Smith'
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('dev-mode-id')
      expect(consoleSpy).toHaveBeenCalledWith(
        '📱 Appointment reminder SMS (dev mode):',
        expect.objectContaining({
          to: '+1234567890',
          appointmentTitle: 'Property Showing',
          appointmentTime: '2024-01-15 10:00 AM'
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('sendUrgentNotificationSMS', () => {
    it('should log SMS in development mode', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await smsService.sendUrgentNotificationSMS({
        phoneNumber: '+1234567890',
        userName: 'Test User',
        title: 'Urgent Alert',
        message: 'This is an urgent notification'
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('dev-mode-id')
      expect(consoleSpy).toHaveBeenCalledWith(
        '📱 Urgent notification SMS (dev mode):',
        expect.objectContaining({
          to: '+1234567890',
          title: 'Urgent Alert'
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('sendCustomSMS', () => {
    it('should log SMS in development mode', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await smsService.sendCustomSMS('+1234567890', 'Custom message')

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('dev-mode-id')
      expect(consoleSpy).toHaveBeenCalledWith(
        '📱 Custom SMS (dev mode):',
        expect.objectContaining({
          to: '+1234567890',
          message: 'Custom message'
        })
      )

      consoleSpy.mockRestore()
    })
  })
})

describe('formatPhoneNumber', () => {
  it('should add +1 to 10-digit US numbers', () => {
    expect(formatPhoneNumber('1234567890')).toBe('+11234567890')
  })

  it('should add + to 11-digit numbers starting with 1', () => {
    expect(formatPhoneNumber('11234567890')).toBe('+11234567890')
  })

  it('should return numbers that already have +', () => {
    expect(formatPhoneNumber('+11234567890')).toBe('+11234567890')
  })

  it('should add + to international numbers', () => {
    expect(formatPhoneNumber('441234567890')).toBe('+441234567890')
  })
})

describe('validatePhoneNumber', () => {
  it('should validate correct phone numbers', () => {
    expect(validatePhoneNumber('+11234567890')).toBe(true)
    expect(validatePhoneNumber('+441234567890')).toBe(true)
    expect(validatePhoneNumber('1234567890')).toBe(true)
  })

  it('should reject invalid phone numbers', () => {
    expect(validatePhoneNumber('')).toBe(false)
    expect(validatePhoneNumber('123')).toBe(false)
    expect(validatePhoneNumber('abc')).toBe(false)
    expect(validatePhoneNumber('12345')).toBe(false) // Too short
    expect(validatePhoneNumber('+123456789012345678')).toBe(false) // Too long
  })

  it('should handle formatted phone numbers', () => {
    expect(validatePhoneNumber('(123) 456-7890')).toBe(true)
    expect(validatePhoneNumber('123-456-7890')).toBe(true)
    expect(validatePhoneNumber('123 456 7890')).toBe(true)
  })
})