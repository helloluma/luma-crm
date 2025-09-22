import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

export interface PasswordResetEmailData {
  email: string
  resetUrl: string
  userName?: string
}

export interface NotificationEmailData {
  email: string
  userName: string
  title: string
  message: string
  actionUrl?: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface DeadlineReminderEmailData {
  email: string
  userName: string
  clientName: string
  deadline: string
  description: string
  actionUrl?: string
}

export interface AppointmentReminderEmailData {
  email: string
  userName: string
  appointmentTitle: string
  appointmentTime: string
  location?: string
  clientName?: string
  actionUrl?: string
}

export const emailService = {
  // Send password reset email
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const template: EmailTemplate = {
        to: data.email,
        subject: 'Reset Your Password - Real Estate CRM',
        html: generatePasswordResetHTML(data),
        text: generatePasswordResetText(data)
      }

      if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
        const response = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
          to: template.to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })

        if (response.error) {
          console.error('Resend API error:', response.error)
          return { success: false, error: response.error.message }
        }

        return { success: true, id: response.data?.id }
      } else {
        // Development mode - log email instead of sending
        console.log('📧 Password reset email (dev mode):', {
          to: template.to,
          subject: template.subject,
          resetUrl: data.resetUrl
        })
        return { success: true, id: 'dev-mode-id' }
      }
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  },

  // Send welcome email for new users
  async sendWelcomeEmail(email: string, userName: string): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const template: EmailTemplate = {
        to: email,
        subject: 'Welcome to Real Estate CRM',
        html: generateWelcomeHTML({ email, userName }),
        text: generateWelcomeText({ email, userName })
      }

      if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
        const response = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
          to: template.to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })

        if (response.error) {
          console.error('Resend API error:', response.error)
          return { success: false, error: response.error.message }
        }

        return { success: true, id: response.data?.id }
      } else {
        // Development mode - log email instead of sending
        console.log('📧 Welcome email (dev mode):', {
          to: template.to,
          subject: template.subject,
          userName
        })
        return { success: true, id: 'dev-mode-id' }
      }
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  },

  // Send notification email
  async sendNotificationEmail(data: NotificationEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const template: EmailTemplate = {
        to: data.email,
        subject: `${getNotificationTypePrefix(data.type)} ${data.title}`,
        html: generateNotificationHTML(data),
        text: generateNotificationText(data)
      }

      if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
        const response = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
          to: template.to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })

        if (response.error) {
          console.error('Resend API error:', response.error)
          return { success: false, error: response.error.message }
        }

        return { success: true, id: response.data?.id }
      } else {
        // Development mode - log email instead of sending
        console.log('📧 Notification email (dev mode):', {
          to: template.to,
          subject: template.subject,
          type: data.type,
          title: data.title
        })
        return { success: true, id: 'dev-mode-id' }
      }
    } catch (error) {
      console.error('Failed to send notification email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  },

  // Send deadline reminder email
  async sendDeadlineReminderEmail(data: DeadlineReminderEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const template: EmailTemplate = {
        to: data.email,
        subject: `⏰ Deadline Reminder: ${data.clientName}`,
        html: generateDeadlineReminderHTML(data),
        text: generateDeadlineReminderText(data)
      }

      if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
        const response = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
          to: template.to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })

        if (response.error) {
          console.error('Resend API error:', response.error)
          return { success: false, error: response.error.message }
        }

        return { success: true, id: response.data?.id }
      } else {
        // Development mode - log email instead of sending
        console.log('📧 Deadline reminder email (dev mode):', {
          to: template.to,
          subject: template.subject,
          clientName: data.clientName,
          deadline: data.deadline
        })
        return { success: true, id: 'dev-mode-id' }
      }
    } catch (error) {
      console.error('Failed to send deadline reminder email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  },

  // Send appointment reminder email
  async sendAppointmentReminderEmail(data: AppointmentReminderEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const template: EmailTemplate = {
        to: data.email,
        subject: `📅 Appointment Reminder: ${data.appointmentTitle}`,
        html: generateAppointmentReminderHTML(data),
        text: generateAppointmentReminderText(data)
      }

      if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
        const response = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
          to: template.to,
          subject: template.subject,
          html: template.html,
          text: template.text
        })

        if (response.error) {
          console.error('Resend API error:', response.error)
          return { success: false, error: response.error.message }
        }

        return { success: true, id: response.data?.id }
      } else {
        // Development mode - log email instead of sending
        console.log('📧 Appointment reminder email (dev mode):', {
          to: template.to,
          subject: template.subject,
          appointmentTitle: data.appointmentTitle,
          appointmentTime: data.appointmentTime
        })
        return { success: true, id: 'dev-mode-id' }
      }
    } catch (error) {
      console.error('Failed to send appointment reminder email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  }
}

// Helper functions
function getNotificationTypePrefix(type: NotificationEmailData['type']): string {
  switch (type) {
    case 'success': return '✅'
    case 'warning': return '⚠️'
    case 'error': return '❌'
    case 'info':
    default: return 'ℹ️'
  }
}

function getNotificationTypeColor(type: NotificationEmailData['type']): string {
  switch (type) {
    case 'success': return '#10b981'
    case 'warning': return '#f59e0b'
    case 'error': return '#ef4444'
    case 'info':
    default: return '#3b82f6'
  }
}

// Email template generators
function generatePasswordResetHTML(data: PasswordResetEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Real Estate CRM</div>
        </div>
        
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hello${data.userName ? ` ${data.userName}` : ''},</p>
          <p>We received a request to reset your password for your Real Estate CRM account.</p>
          <p>Click the button below to reset your password:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" class="button">Reset Password</a>
          </p>
          
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          <p>This link will expire in 24 hours for security reasons.</p>
        </div>
        
        <div class="footer">
          <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
          <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generatePasswordResetText(data: PasswordResetEmailData): string {
  return `
Reset Your Password - Real Estate CRM

Hello${data.userName ? ` ${data.userName}` : ''},

We received a request to reset your password for your Real Estate CRM account.

To reset your password, visit this link:
${data.resetUrl}

If you didn't request this password reset, you can safely ignore this email.
This link will expire in 24 hours for security reasons.

---
Real Estate CRM Team
  `.trim()
}

function generateWelcomeHTML(data: { email: string; userName: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Real Estate CRM</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Real Estate CRM</div>
        </div>
        
        <div class="content">
          <h2>Welcome to Real Estate CRM!</h2>
          <p>Hello ${data.userName},</p>
          <p>Welcome to your new Real Estate CRM! We're excited to help you manage your clients, track deals, and grow your business.</p>
          
          <h3>Getting Started:</h3>
          <ul>
            <li>Complete your profile setup</li>
            <li>Add your first client</li>
            <li>Explore the dashboard features</li>
            <li>Set up your calendar and notifications</li>
          </ul>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">Get Started</a>
          </p>
        </div>
        
        <div class="footer">
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateWelcomeText(data: { email: string; userName: string }): string {
  return `
Welcome to Real Estate CRM!

Hello ${data.userName},

Welcome to your new Real Estate CRM! We're excited to help you manage your clients, track deals, and grow your business.

Getting Started:
- Complete your profile setup
- Add your first client
- Explore the dashboard features
- Set up your calendar and notifications

Visit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

If you have any questions, feel free to reach out to our support team.

---
Real Estate CRM Team
  `.trim()
}

function generateNotificationHTML(data: NotificationEmailData): string {
  const typeColor = getNotificationTypeColor(data.type)
  const typePrefix = getNotificationTypePrefix(data.type)
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; }
        .notification-header { display: flex; align-items: center; margin-bottom: 20px; }
        .notification-icon { font-size: 24px; margin-right: 12px; }
        .notification-title { font-size: 20px; font-weight: 600; color: ${typeColor}; }
        .button { display: inline-block; background: ${typeColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Real Estate CRM</div>
        </div>
        
        <div class="content">
          <div class="notification-header">
            <span class="notification-icon">${typePrefix}</span>
            <h2 class="notification-title">${data.title}</h2>
          </div>
          
          <p>Hello ${data.userName},</p>
          <p>${data.message}</p>
          
          ${data.actionUrl ? `
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" class="button">View Details</a>
            </p>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>You received this notification from your Real Estate CRM.</p>
          ${data.actionUrl ? `<p><a href="${data.actionUrl}">${data.actionUrl}</a></p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}

function generateNotificationText(data: NotificationEmailData): string {
  const typePrefix = getNotificationTypePrefix(data.type)
  
  return `
${typePrefix} ${data.title}

Hello ${data.userName},

${data.message}

${data.actionUrl ? `View details: ${data.actionUrl}` : ''}

---
Real Estate CRM Team
  `.trim()
}

function generateDeadlineReminderHTML(data: DeadlineReminderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Deadline Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { background: #fef3c7; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .deadline-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Real Estate CRM</div>
        </div>
        
        <div class="content">
          <h2>⏰ Deadline Reminder</h2>
          <p>Hello ${data.userName},</p>
          <p>This is a reminder about an upcoming deadline for your client <strong>${data.clientName}</strong>.</p>
          
          <div class="deadline-info">
            <h3>Deadline Details:</h3>
            <p><strong>Client:</strong> ${data.clientName}</p>
            <p><strong>Due Date:</strong> ${data.deadline}</p>
            <p><strong>Description:</strong> ${data.description}</p>
          </div>
          
          ${data.actionUrl ? `
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" class="button">View Client Details</a>
            </p>
          ` : ''}
          
          <p>Make sure to complete this task on time to maintain excellent client service.</p>
        </div>
        
        <div class="footer">
          <p>Stay on top of your deadlines with Real Estate CRM.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateDeadlineReminderText(data: DeadlineReminderEmailData): string {
  return `
⏰ Deadline Reminder

Hello ${data.userName},

This is a reminder about an upcoming deadline for your client ${data.clientName}.

Deadline Details:
- Client: ${data.clientName}
- Due Date: ${data.deadline}
- Description: ${data.description}

${data.actionUrl ? `View client details: ${data.actionUrl}` : ''}

Make sure to complete this task on time to maintain excellent client service.

---
Real Estate CRM Team
  `.trim()
}

function generateAppointmentReminderHTML(data: AppointmentReminderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .content { background: #dbeafe; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .appointment-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Real Estate CRM</div>
        </div>
        
        <div class="content">
          <h2>📅 Appointment Reminder</h2>
          <p>Hello ${data.userName},</p>
          <p>This is a reminder about your upcoming appointment.</p>
          
          <div class="appointment-info">
            <h3>Appointment Details:</h3>
            <p><strong>Title:</strong> ${data.appointmentTitle}</p>
            <p><strong>Date & Time:</strong> ${data.appointmentTime}</p>
            ${data.clientName ? `<p><strong>Client:</strong> ${data.clientName}</p>` : ''}
            ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
          </div>
          
          ${data.actionUrl ? `
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" class="button">View Appointment</a>
            </p>
          ` : ''}
          
          <p>Don't forget to prepare for your appointment and arrive on time.</p>
        </div>
        
        <div class="footer">
          <p>Stay organized with Real Estate CRM.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAppointmentReminderText(data: AppointmentReminderEmailData): string {
  return `
📅 Appointment Reminder

Hello ${data.userName},

This is a reminder about your upcoming appointment.

Appointment Details:
- Title: ${data.appointmentTitle}
- Date & Time: ${data.appointmentTime}
${data.clientName ? `- Client: ${data.clientName}` : ''}
${data.location ? `- Location: ${data.location}` : ''}

${data.actionUrl ? `View appointment: ${data.actionUrl}` : ''}

Don't forget to prepare for your appointment and arrive on time.

---
Real Estate CRM Team
  `.trim()
}