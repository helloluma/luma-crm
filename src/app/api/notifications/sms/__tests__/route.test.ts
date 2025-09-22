import { NextRequest } from 'next/server'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase'
import { smsService } from '@/lib/sms'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(),
}))

// Mock SMS service
vi.mock('@/lib/sms', () => ({
  smsService: {
    sendDeadlineReminderSMS: vi.fn(),
    sendAppointmentReminderSMS: vi.fn(),
    sendUrgentNotificationSMS: vi.fn(),
    sendCustomSMS: vi.fn(),
  },
  formatPhoneNumber: vi.fn((phone) => phone.startsWith('+') ? phone : `+1${phone}`),
  validatePhoneNumber: vi.fn((phone) => phone.includes('+1')),
}))

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { role: 'Admin' },
          error: null,
        })),
      })),
    })),
  })),
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase)
})

describe('/api/notifications/sms', () => {
  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/sms', {
        method: 'POST',
        body: JSON.stringify({
          type: 'urgent',
          recipients: [{ phoneNumber: '+1234567890' }],
          message: 'Test message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 if required fields are missing', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/sms', {
        method: 'POST',
        body: JSON.stringify({
          type: 'urgent',
          // Missing recipients and message
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Type, recipients, and message are required')
    })

    it('should return 400 for invalid SMS type', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/sms', {
        method: 'POST',
        body: JSON.stringify({
          type: 'invalid-type',
          recipients: [{ phoneNumber: '+1234567890' }],
          message: 'Test message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid SMS type. Must be one of: deadline, appointment, urgent, custom')
    })

    it('should send deadline reminder SMS successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      ;(smsService.sendDeadlineReminderSMS as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        messageId: 'sms-id-1',
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/sms', {
        method: 'POST',
        body: JSON.stringify({
          type: 'deadline',
          recipients: [{ 
            phoneNumber: '+1234567890', 
            name: 'Test User',
            clientName: 'John Doe',
            deadline: '2024-01-15'
          }],
          message: 'Contract signing deadline approaching',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.sent).toBe(1)
      expect(data.failed).toBe(0)
      expect(data.results).toHaveLength(1)
      expect(data.results[0]).toEqual({
        phoneNumber: '+1234567890',
        success: true,
        messageId: 'sms-id-1',
      })

      expect(smsService.sendDeadlineReminderSMS).toHaveBeenCalledWith({
        phoneNumber: '+1234567890',
        userName: 'Test User',
        clientName: 'John Doe',
        deadline: '2024-01-15',
        description: 'Contract signing deadline approaching',
      })
    })

    it('should send appointment reminder SMS successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      ;(smsService.sendAppointmentReminderSMS as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        messageId: 'sms-id-2',
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/sms', {
        method: 'POST',
        body: JSON.stringify({
          type: 'appointment',
          recipients: [{ 
            phoneNumber: '+1234567890', 
            name: 'Test User',
            appointmentTime: '2024-01-15 10:00 AM',
            clientName: 'Jane Smith',
            location: '123 Main St'
          }],
          title: 'Property Showing',
          message: 'You have an upcoming appointment.',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(smsService.sendAppointmentReminderSMS).toHaveBeenCalledWith({
        phoneNumber: '+1234567890',
        userName: 'Test User',
        appointmentTitle: 'Property Showing',
        appointmentTime: '2024-01-15 10:00 AM',
        location: '123 Main St',
        clientName: 'Jane Smith',
      })
    })

    it('should send urgent notification SMS successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      ;(smsService.sendUrgentNotificationSMS as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        messageId: 'sms-id-3',
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/sms', {
        method: 'POST',
        body: JSON.stringify({
          type: 'urgent',
          recipients: [{ 
            phoneNumber: '+1234567890', 
            name: 'Test User'
          }],
          title: 'Urgent Alert',
          message: 'This is an urgent notification',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(smsService.sendUrgentNotificationSMS).toHaveBeenCalledWith({
        phoneNumber: '+1234567890',
        userName: 'Test User',
        title: 'Urgent Alert',
        message: 'This is an urgent notification',
      })
    })

    it('should send custom SMS successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      ;(smsService.sendCustomSMS as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        messageId: 'sms-id-4',
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/sms', {
        method: 'POST',
        body: JSON.stringify({
          type: 'custom',
          recipients: [{ phoneNumber: '+1234567890' }],
          message: 'Custom SMS message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(smsService.sendCustomSMS).toHaveBeenCalledWith('+1234567890', 'Custom SMS message')
    })

    it('should handle invalid phone numbers', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock validatePhoneNumber to return false for invalid numbers
      const { validatePhoneNumber } = await import('@/lib/sms')
      ;(validatePhoneNumber as ReturnType<typeof vi.fn>).mockReturnValue(false)

      const request = new NextRequest('http://localhost:3000/api/notifications/sms', {
        method: 'POST',
        body: JSON.stringify({
          type: 'custom',
          recipients: [{ phoneNumber: 'invalid-phone' }],
          message: 'Test message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(207) // Multi-Status
      expect(data.success).toBe(false)
      expect(data.sent).toBe(0)
      expect(data.failed).toBe(1)
      expect(data.errors).toHaveLength(1)
      expect(data.errors[0]).toEqual({
        phoneNumber: 'invalid-phone',
        error: 'Invalid phone number format',
      })
    })

    it('should handle partial failures', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock validatePhoneNumber to return true for both numbers
      const { validatePhoneNumber } = await import('@/lib/sms')
      ;(validatePhoneNumber as ReturnType<typeof vi.fn>).mockReturnValue(true)

      ;(smsService.sendCustomSMS as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ success: true, messageId: 'sms-id-1' })
        .mockResolvedValueOnce({ success: false, error: 'SMS delivery failed' })

      const request = new NextRequest('http://localhost:3000/api/notifications/sms', {
        method: 'POST',
        body: JSON.stringify({
          type: 'custom',
          recipients: [
            { phoneNumber: '+1234567890' },
            { phoneNumber: '+1987654321' }
          ],
          message: 'Test message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(207) // Multi-Status
      expect(data.success).toBe(false)
      expect(data.sent).toBe(1)
      expect(data.failed).toBe(1)
      expect(data.results).toHaveLength(1)
      expect(data.errors).toHaveLength(1)
    })
  })
})