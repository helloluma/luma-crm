import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { emailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, recipients, title, message, actionUrl } = body

    // Validate required fields
    if (!type || !recipients || !title || !message) {
      return NextResponse.json({ 
        error: 'Type, recipients, title, and message are required' 
      }, { status: 400 })
    }

    // Validate email type
    const validTypes = ['notification', 'deadline', 'appointment']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid email type. Must be one of: notification, deadline, appointment' 
      }, { status: 400 })
    }

    // Ensure recipients is an array
    const recipientList = Array.isArray(recipients) ? recipients : [recipients]

    // Check if user has permission to send emails to other users
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['Admin', 'SuperAdmin'].includes(profile.role)) {
      // Non-admin users can only send emails to themselves
      const userEmail = user.email
      const hasUnauthorizedRecipient = recipientList.some(
        (recipient: any) => recipient.email !== userEmail
      )
      
      if (hasUnauthorizedRecipient) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to send emails to other users' 
        }, { status: 403 })
      }
    }

    const results = []
    const errors = []

    // Send emails to all recipients
    for (const recipient of recipientList) {
      try {
        let result

        switch (type) {
          case 'notification':
            result = await emailService.sendNotificationEmail({
              email: recipient.email,
              userName: recipient.name || recipient.email,
              title,
              message,
              actionUrl,
              type: recipient.notificationType || 'info'
            })
            break

          case 'deadline':
            result = await emailService.sendDeadlineReminderEmail({
              email: recipient.email,
              userName: recipient.name || recipient.email,
              clientName: recipient.clientName || 'Unknown Client',
              deadline: recipient.deadline || 'Not specified',
              description: message,
              actionUrl
            })
            break

          case 'appointment':
            result = await emailService.sendAppointmentReminderEmail({
              email: recipient.email,
              userName: recipient.name || recipient.email,
              appointmentTitle: title,
              appointmentTime: recipient.appointmentTime || 'Not specified',
              location: recipient.location,
              clientName: recipient.clientName,
              actionUrl
            })
            break

          default:
            throw new Error(`Unsupported email type: ${type}`)
        }

        if (result.success) {
          results.push({
            email: recipient.email,
            success: true,
            id: result.id
          })
        } else {
          errors.push({
            email: recipient.email,
            error: result.error
          })
        }
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error)
        errors.push({
          email: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Return results
    const response = {
      success: errors.length === 0,
      sent: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    }

    return NextResponse.json(response, { 
      status: errors.length === 0 ? 200 : 207 // 207 Multi-Status for partial success
    })

  } catch (error) {
    console.error('Error in email notification API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}