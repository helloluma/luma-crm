import { NextRequest } from 'next/server'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { POST } from '../route'
import { createClient } from '@/lib/supabase'
import { emailService } from '@/lib/email'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(),
}))

// Mock email service
vi.mock('@/lib/email', () => ({
  emailService: {
    sendNotificationEmail: vi.fn(),
    sendDeadlineReminderEmail: vi.fn(),
    sendAppointmentReminderEmail: vi.fn(),
  },
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

describe('/api/notifications/email', () => {
  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          type: 'notification',
          recipients: [{ email: 'test@example.com' }],
          title: 'Test',
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

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          type: 'notification',
          // Missing recipients, title, message
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Type, recipients, title, and message are required')
    })

    it('should return 400 for invalid email type', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          type: 'invalid-type',
          recipients: [{ email: 'test@example.com' }],
          title: 'Test',
          message: 'Test message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email type. Must be one of: notification, deadline, appointment')
    })

    it('should send notification email successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      ;(emailService.sendNotificationEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        id: 'email-id-1',
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          type: 'notification',
          recipients: [{ email: 'test@example.com', name: 'Test User' }],
          title: 'Test Notification',
          message: 'This is a test notification',
          actionUrl: 'https://example.com/action',
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
        email: 'test@example.com',
        success: true,
        id: 'email-id-1',
      })

      expect(emailService.sendNotificationEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        userName: 'Test User',
        title: 'Test Notification',
        message: 'This is a test notification',
        actionUrl: 'https://example.com/action',
        type: 'info',
      })
    })

    it('should send deadline reminder email successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      ;(emailService.sendDeadlineReminderEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        id: 'email-id-2',
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          type: 'deadline',
          recipients: [{ 
            email: 'test@example.com', 
            name: 'Test User',
            clientName: 'John Doe',
            deadline: '2024-01-15'
          }],
          title: 'Deadline Reminder',
          message: 'Contract signing deadline approaching',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(emailService.sendDeadlineReminderEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        userName: 'Test User',
        clientName: 'John Doe',
        deadline: '2024-01-15',
        description: 'Contract signing deadline approaching',
        actionUrl: undefined,
      })
    })

    it('should send appointment reminder email successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      ;(emailService.sendAppointmentReminderEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        id: 'email-id-3',
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          type: 'appointment',
          recipients: [{ 
            email: 'test@example.com', 
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
      expect(emailService.sendAppointmentReminderEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        userName: 'Test User',
        appointmentTitle: 'Property Showing',
        appointmentTime: '2024-01-15 10:00 AM',
        location: '123 Main St',
        clientName: 'Jane Smith',
        actionUrl: undefined,
      })
    })

    it('should handle partial failures', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      ;(emailService.sendNotificationEmail as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ success: true, id: 'email-id-1' })
        .mockResolvedValueOnce({ success: false, error: 'Email delivery failed' })

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          type: 'notification',
          recipients: [
            { email: 'success@example.com', name: 'Success User' },
            { email: 'fail@example.com', name: 'Fail User' }
          ],
          title: 'Test Notification',
          message: 'This is a test notification',
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

    it('should restrict non-admin users to sending emails to themselves only', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock non-admin user
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'Assistant' },
              error: null,
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        body: JSON.stringify({
          type: 'notification',
          recipients: [{ email: 'other@example.com', name: 'Other User' }],
          title: 'Test Notification',
          message: 'This is a test notification',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Insufficient permissions to send emails to other users')
    })
  })
})