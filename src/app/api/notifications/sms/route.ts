import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { smsService, formatPhoneNumber, validatePhoneNumber } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, recipients, title, message } = body

    // Validate required fields
    if (!type || !recipients || !message) {
      return NextResponse.json({ 
        error: 'Type, recipients, and message are required' 
      }, { status: 400 })
    }

    // Validate SMS type
    const validTypes = ['deadline', 'appointment', 'urgent', 'custom']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid SMS type. Must be one of: deadline, appointment, urgent, custom' 
      }, { status: 400 })
    }

    // Ensure recipients is an array
    const recipientList = Array.isArray(recipients) ? recipients : [recipients]

    // Check if user has permission to send SMS to other users
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['Admin', 'SuperAdmin'].includes(profile.role)) {
      // Non-admin users can only send SMS to themselves
      const userProfile = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single()

      const userPhone = userProfile.data?.phone
      const hasUnauthorizedRecipient = recipientList.some(
        (recipient: any) => recipient.phoneNumber !== userPhone
      )
      
      if (hasUnauthorizedRecipient) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to send SMS to other users' 
        }, { status: 403 })
      }
    }

    const results = []
    const errors = []

    // Send SMS to all recipients
    for (const recipient of recipientList) {
      try {
        // Validate and format phone number
        if (!validatePhoneNumber(recipient.phoneNumber)) {
          errors.push({
            phoneNumber: recipient.phoneNumber,
            error: 'Invalid phone number format'
          })
          continue
        }

        const formattedPhone = formatPhoneNumber(recipient.phoneNumber)
        let result

        switch (type) {
          case 'deadline':
            result = await smsService.sendDeadlineReminderSMS({
              phoneNumber: formattedPhone,
              userName: recipient.name || 'User',
              clientName: recipient.clientName || 'Unknown Client',
              deadline: recipient.deadline || 'Not specified',
              description: message
            })
            break

          case 'appointment':
            result = await smsService.sendAppointmentReminderSMS({
              phoneNumber: formattedPhone,
              userName: recipient.name || 'User',
              appointmentTitle: title || 'Appointment',
              appointmentTime: recipient.appointmentTime || 'Not specified',
              location: recipient.location,
              clientName: recipient.clientName
            })
            break

          case 'urgent':
            result = await smsService.sendUrgentNotificationSMS({
              phoneNumber: formattedPhone,
              userName: recipient.name || 'User',
              title: title || 'Urgent Notification',
              message
            })
            break

          case 'custom':
            result = await smsService.sendCustomSMS(formattedPhone, message)
            break

          default:
            throw new Error(`Unsupported SMS type: ${type}`)
        }

        if (result.success) {
          results.push({
            phoneNumber: recipient.phoneNumber,
            success: true,
            messageId: result.messageId
          })
        } else {
          errors.push({
            phoneNumber: recipient.phoneNumber,
            error: result.error
          })
        }
      } catch (error) {
        console.error(`Failed to send SMS to ${recipient.phoneNumber}:`, error)
        errors.push({
          phoneNumber: recipient.phoneNumber,
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
    console.error('Error in SMS notification API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}