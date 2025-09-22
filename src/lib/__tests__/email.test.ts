import { vi, beforeEach, describe, it, expect } from 'vitest'
import { emailService } from '../email'

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(),
    },
  })),
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

describe('emailService', () => {
  describe('sendPasswordResetEmail', () => {
    it('should log email in development mode', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await emailService.sendPasswordResetEmail({
        email: 'test@example.com',
        resetUrl: 'https://example.com/reset',
        userName: 'Test User'
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('dev-mode-id')
      expect(consoleSpy).toHaveBeenCalledWith(
        '📧 Password reset email (dev mode):',
        expect.objectContaining({
          to: 'test@example.com',
          resetUrl: 'https://example.com/reset'
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

      const result = await emailService.sendPasswordResetEmail({
        email: 'test@example.com',
        resetUrl: 'https://example.com/reset'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Console error')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      consoleLogSpy.mockRestore()
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should log email in development mode', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await emailService.sendWelcomeEmail('test@example.com', 'Test User')

      expect(result.success).toBe(true)
      expect(result.id).toBe('dev-mode-id')
      expect(consoleSpy).toHaveBeenCalledWith(
        '📧 Welcome email (dev mode):',
        expect.objectContaining({
          to: 'test@example.com',
          userName: 'Test User'
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('sendNotificationEmail', () => {
    it('should log email in development mode', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await emailService.sendNotificationEmail({
        email: 'test@example.com',
        userName: 'Test User',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
        actionUrl: 'https://example.com/action'
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('dev-mode-id')
      expect(consoleSpy).toHaveBeenCalledWith(
        '📧 Notification email (dev mode):',
        expect.objectContaining({
          to: 'test@example.com',
          type: 'info',
          title: 'Test Notification'
        })
      )

      consoleSpy.mockRestore()
    })

    it('should include correct subject prefix for different types', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Test different notification types
      const types = [
        { type: 'info' as const, expectedPrefix: 'ℹ️' },
        { type: 'success' as const, expectedPrefix: '✅' },
        { type: 'warning' as const, expectedPrefix: '⚠️' },
        { type: 'error' as const, expectedPrefix: '❌' },
      ]

      for (const { type, expectedPrefix } of types) {
        await emailService.sendNotificationEmail({
          email: 'test@example.com',
          userName: 'Test User',
          title: 'Test Notification',
          message: 'This is a test notification',
          type
        })

        expect(consoleSpy).toHaveBeenCalledWith(
          '📧 Notification email (dev mode):',
          expect.objectContaining({
            subject: `${expectedPrefix} Test Notification`
          })
        )
      }

      consoleSpy.mockRestore()
    })
  })

  describe('sendDeadlineReminderEmail', () => {
    it('should log email in development mode', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await emailService.sendDeadlineReminderEmail({
        email: 'test@example.com',
        userName: 'Test User',
        clientName: 'John Doe',
        deadline: '2024-01-15',
        description: 'Contract signing deadline',
        actionUrl: 'https://example.com/client/123'
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('dev-mode-id')
      expect(consoleSpy).toHaveBeenCalledWith(
        '📧 Deadline reminder email (dev mode):',
        expect.objectContaining({
          to: 'test@example.com',
          clientName: 'John Doe',
          deadline: '2024-01-15'
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('sendAppointmentReminderEmail', () => {
    it('should log email in development mode', async () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await emailService.sendAppointmentReminderEmail({
        email: 'test@example.com',
        userName: 'Test User',
        appointmentTitle: 'Property Showing',
        appointmentTime: '2024-01-15 10:00 AM',
        location: '123 Main St',
        clientName: 'Jane Smith',
        actionUrl: 'https://example.com/appointment/456'
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('dev-mode-id')
      expect(consoleSpy).toHaveBeenCalledWith(
        '📧 Appointment reminder email (dev mode):',
        expect.objectContaining({
          to: 'test@example.com',
          appointmentTitle: 'Property Showing',
          appointmentTime: '2024-01-15 10:00 AM'
        })
      )

      consoleSpy.mockRestore()
    })
  })
})