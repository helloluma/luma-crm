import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

// Initialize AWS SNS client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export interface SMSTemplate {
  phoneNumber: string
  message: string
}

export interface DeadlineReminderSMSData {
  phoneNumber: string
  userName: string
  clientName: string
  deadline: string
  description: string
}

export interface AppointmentReminderSMSData {
  phoneNumber: string
  userName: string
  appointmentTitle: string
  appointmentTime: string
  location?: string
  clientName?: string
}

export interface UrgentNotificationSMSData {
  phoneNumber: string
  userName: string
  title: string
  message: string
}

export const smsService = {
  // Send urgent deadline reminder SMS
  async sendDeadlineReminderSMS(data: DeadlineReminderSMSData): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      const message = generateDeadlineReminderSMS(data)
      
      if (process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID) {
        const command = new PublishCommand({
          PhoneNumber: data.phoneNumber,
          Message: message,
          MessageAttributes: {
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional'
            }
          }
        })

        const response = await snsClient.send(command)
        
        return { 
          success: true, 
          messageId: response.MessageId 
        }
      } else {
        // Development mode - log SMS instead of sending
        console.log('📱 Deadline reminder SMS (dev mode):', {
          to: data.phoneNumber,
          message,
          clientName: data.clientName,
          deadline: data.deadline
        })
        return { success: true, messageId: 'dev-mode-id' }
      }
    } catch (error) {
      console.error('Failed to send deadline reminder SMS:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send SMS' 
      }
    }
  },

  // Send appointment reminder SMS
  async sendAppointmentReminderSMS(data: AppointmentReminderSMSData): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      const message = generateAppointmentReminderSMS(data)
      
      if (process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID) {
        const command = new PublishCommand({
          PhoneNumber: data.phoneNumber,
          Message: message,
          MessageAttributes: {
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional'
            }
          }
        })

        const response = await snsClient.send(command)
        
        return { 
          success: true, 
          messageId: response.MessageId 
        }
      } else {
        // Development mode - log SMS instead of sending
        console.log('📱 Appointment reminder SMS (dev mode):', {
          to: data.phoneNumber,
          message,
          appointmentTitle: data.appointmentTitle,
          appointmentTime: data.appointmentTime
        })
        return { success: true, messageId: 'dev-mode-id' }
      }
    } catch (error) {
      console.error('Failed to send appointment reminder SMS:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send SMS' 
      }
    }
  },

  // Send urgent notification SMS
  async sendUrgentNotificationSMS(data: UrgentNotificationSMSData): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      const message = generateUrgentNotificationSMS(data)
      
      if (process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID) {
        const command = new PublishCommand({
          PhoneNumber: data.phoneNumber,
          Message: message,
          MessageAttributes: {
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional'
            }
          }
        })

        const response = await snsClient.send(command)
        
        return { 
          success: true, 
          messageId: response.MessageId 
        }
      } else {
        // Development mode - log SMS instead of sending
        console.log('📱 Urgent notification SMS (dev mode):', {
          to: data.phoneNumber,
          message,
          title: data.title
        })
        return { success: true, messageId: 'dev-mode-id' }
      }
    } catch (error) {
      console.error('Failed to send urgent notification SMS:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send SMS' 
      }
    }
  },

  // Send custom SMS
  async sendCustomSMS(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      if (process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID) {
        const command = new PublishCommand({
          PhoneNumber: phoneNumber,
          Message: message,
          MessageAttributes: {
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional'
            }
          }
        })

        const response = await snsClient.send(command)
        
        return { 
          success: true, 
          messageId: response.MessageId 
        }
      } else {
        // Development mode - log SMS instead of sending
        console.log('📱 Custom SMS (dev mode):', {
          to: phoneNumber,
          message
        })
        return { success: true, messageId: 'dev-mode-id' }
      }
    } catch (error) {
      console.error('Failed to send custom SMS:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send SMS' 
      }
    }
  }
}

// SMS template generators
function generateDeadlineReminderSMS(data: DeadlineReminderSMSData): string {
  return `🏠 Real Estate CRM Alert

Hi ${data.userName},

⏰ DEADLINE REMINDER
Client: ${data.clientName}
Due: ${data.deadline}
Task: ${data.description}

Don't miss this important deadline!

- Real Estate CRM`
}

function generateAppointmentReminderSMS(data: AppointmentReminderSMSData): string {
  const locationText = data.location ? `\nLocation: ${data.location}` : ''
  const clientText = data.clientName ? `\nClient: ${data.clientName}` : ''
  
  return `🏠 Real Estate CRM Reminder

Hi ${data.userName},

📅 APPOINTMENT REMINDER
${data.appointmentTitle}
Time: ${data.appointmentTime}${clientText}${locationText}

See you there!

- Real Estate CRM`
}

function generateUrgentNotificationSMS(data: UrgentNotificationSMSData): string {
  return `🏠 Real Estate CRM Alert

Hi ${data.userName},

🚨 ${data.title}

${data.message}

- Real Estate CRM`
}

// Utility functions
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '')
  
  // Add country code if not present (assuming US)
  if (digits.length === 10) {
    return `+1${digits}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  } else if (digits.startsWith('+')) {
    return phoneNumber
  } else {
    return `+${digits}`
  }
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false
  
  // Remove all non-digit characters for initial validation
  const digits = phoneNumber.replace(/\D/g, '')
  
  // Must have at least 10 digits for a valid phone number
  if (digits.length < 10) return false
  
  const formatted = formatPhoneNumber(phoneNumber)
  // Basic validation for international phone numbers
  // Must start with +, followed by country code (1-9), then 1-14 more digits
  const phoneRegex = /^\+[1-9]\d{9,14}$/
  return phoneRegex.test(formatted)
}