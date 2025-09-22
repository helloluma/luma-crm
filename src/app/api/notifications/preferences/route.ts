import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create notification preferences for the user
    const { data: preferences, error } = await supabase
      .rpc('get_or_create_notification_preferences', { p_user_id: user.id })

    if (error) {
      console.error('Error fetching notification preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch notification preferences' }, { status: 500 })
    }

    return NextResponse.json({ data: preferences })
  } catch (error) {
    console.error('Error in notification preferences GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email_new_leads,
      email_appointment_reminders,
      email_deadline_alerts,
      email_transaction_updates,
      email_client_messages,
      email_system_notifications,
      sms_urgent_deadlines,
      sms_appointment_reminders,
      sms_emergency_alerts,
      inapp_all_notifications,
      phone_number,
      email_frequency,
      sms_frequency,
      quiet_hours_start,
      quiet_hours_end,
      quiet_hours_enabled,
      timezone
    } = body

    // Validate email frequency
    if (email_frequency && !['immediate', 'hourly', 'daily', 'weekly'].includes(email_frequency)) {
      return NextResponse.json({ 
        error: 'Invalid email frequency. Must be one of: immediate, hourly, daily, weekly' 
      }, { status: 400 })
    }

    // Validate SMS frequency
    if (sms_frequency && !['immediate', 'urgent_only'].includes(sms_frequency)) {
      return NextResponse.json({ 
        error: 'Invalid SMS frequency. Must be one of: immediate, urgent_only' 
      }, { status: 400 })
    }

    // Validate phone number if SMS notifications are enabled
    if ((sms_urgent_deadlines || sms_appointment_reminders || sms_emergency_alerts) && !phone_number) {
      return NextResponse.json({ 
        error: 'Phone number is required when SMS notifications are enabled' 
      }, { status: 400 })
    }

    // Update or insert notification preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        email_new_leads,
        email_appointment_reminders,
        email_deadline_alerts,
        email_transaction_updates,
        email_client_messages,
        email_system_notifications,
        sms_urgent_deadlines,
        sms_appointment_reminders,
        sms_emergency_alerts,
        inapp_all_notifications,
        phone_number,
        email_frequency,
        sms_frequency,
        quiet_hours_start,
        quiet_hours_end,
        quiet_hours_enabled,
        timezone
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating notification preferences:', error)
      return NextResponse.json({ error: 'Failed to update notification preferences' }, { status: 500 })
    }

    return NextResponse.json({ data: preferences })
  } catch (error) {
    console.error('Error in notification preferences PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}