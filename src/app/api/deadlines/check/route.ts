import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// This endpoint can be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    // Create admin client for system operations
    const supabase = createClient()

    // Get current time and 24 hours from now
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    console.log(`Checking deadlines between ${now.toISOString()} and ${in24Hours.toISOString()}`)

    // Find deadlines that are due within 24 hours and haven't been alerted
    const { data: upcomingDeadlines, error: deadlineError } = await supabase
      .from('client_stage_deadlines')
      .select(`
        *,
        client:clients!client_stage_deadlines_client_id_fkey(
          id,
          name,
          type,
          assigned_agent,
          assigned_agent_profile:profiles!clients_assigned_agent_fkey(
            name,
            email
          )
        )
      `)
      .gte('deadline', now.toISOString())
      .lte('deadline', in24Hours.toISOString())
      .eq('alert_sent', false)

    if (deadlineError) {
      console.error('Error fetching deadlines:', deadlineError)
      return NextResponse.json(
        { error: 'Failed to fetch deadlines' },
        { status: 500 }
      )
    }

    console.log(`Found ${upcomingDeadlines?.length || 0} upcoming deadlines`)

    const notifications = []
    const emailAlerts = []

    // Process each deadline
    for (const deadline of upcomingDeadlines || []) {
      const deadlineDate = new Date(deadline.deadline)
      const hoursUntil = Math.round((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60))
      
      // Determine urgency
      let urgencyLevel = 'medium'
      let notificationType: 'info' | 'warning' | 'error' = 'warning'
      
      if (hoursUntil <= 2) {
        urgencyLevel = 'critical'
        notificationType = 'error'
      } else if (hoursUntil <= 8) {
        urgencyLevel = 'high'
        notificationType = 'error'
      } else if (hoursUntil <= 24) {
        urgencyLevel = 'medium'
        notificationType = 'warning'
      }

      // Create notification title and message
      const title = `${deadline.stage} Stage Deadline Approaching`
      const message = `Client "${deadline.client.name}" has a ${deadline.stage} stage deadline in ${hoursUntil} hours (${deadlineDate.toLocaleDateString()} at ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`

      // Create in-app notification if client has assigned agent
      if (deadline.client.assigned_agent) {
        notifications.push({
          user_id: deadline.client.assigned_agent,
          title,
          message,
          type: notificationType,
          action_url: `/clients/${deadline.client.id}`,
          metadata: {
            deadline_id: deadline.id,
            client_id: deadline.client.id,
            stage: deadline.stage,
            urgency: urgencyLevel,
            hours_until: hoursUntil
          }
        })

        // Prepare email alert
        if (deadline.client.assigned_agent_profile?.email) {
          emailAlerts.push({
            to: deadline.client.assigned_agent_profile.email,
            agentName: deadline.client.assigned_agent_profile.name,
            clientName: deadline.client.name,
            stage: deadline.stage,
            deadline: deadlineDate,
            hoursUntil,
            urgencyLevel
          })
        }
      }

      // Mark deadline as alerted
      await supabase
        .from('client_stage_deadlines')
        .update({
          alert_sent: true,
          alert_sent_at: now.toISOString()
        })
        .eq('id', deadline.id)
    }

    // Insert all notifications at once
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error creating notifications:', notificationError)
      } else {
        console.log(`Created ${notifications.length} notifications`)
      }
    }

    // Send email alerts (in a real implementation, you'd use a service like Resend)
    if (emailAlerts.length > 0) {
      console.log(`Would send ${emailAlerts.length} email alerts:`)
      emailAlerts.forEach(alert => {
        console.log(`- ${alert.to}: ${alert.clientName} ${alert.stage} deadline in ${alert.hoursUntil}h`)
      })
      
      // TODO: Implement actual email sending
      // await sendDeadlineEmails(emailAlerts)
    }

    // Create system activity log
    if (upcomingDeadlines && upcomingDeadlines.length > 0) {
      await supabase
        .from('activities')
        .insert({
          type: 'system_deadline_check',
          title: 'Deadline alerts processed',
          description: `Processed ${upcomingDeadlines.length} upcoming deadlines, created ${notifications.length} notifications`,
          user_id: null, // System activity
          entity_type: 'system',
          entity_id: null,
          metadata: {
            deadlines_processed: upcomingDeadlines.length,
            notifications_created: notifications.length,
            emails_queued: emailAlerts.length
          }
        })
    }

    return NextResponse.json({
      message: 'Deadline check completed',
      data: {
        deadlines_processed: upcomingDeadlines?.length || 0,
        notifications_created: notifications.length,
        emails_queued: emailAlerts.length
      }
    })

  } catch (error) {
    console.error('Deadline check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for manual deadline checking (admin only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Verify authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'SuperAdmin' && profile?.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Call the POST method to trigger deadline check
    return POST(request)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}