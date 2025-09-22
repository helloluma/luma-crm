import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Find appointments with deadlines approaching (24 hours and 7 days)
    const { data: upcomingDeadlines, error: deadlineError } = await supabase
      .from('appointments')
      .select(`
        id,
        title,
        start_time,
        client_id,
        clients (
          id,
          name,
          email,
          assigned_agent
        ),
        profiles!appointments_created_by_fkey (
          id,
          name,
          email
        )
      `)
      .eq('type', 'Deadline')
      .eq('status', 'Scheduled')
      .gte('start_time', now.toISOString())
      .lte('start_time', nextWeek.toISOString());

    if (deadlineError) {
      throw new Error(`Failed to fetch upcoming deadlines: ${deadlineError.message}`);
    }

    let notificationsSent = 0;
    let emailsSent = 0;

    for (const deadline of upcomingDeadlines || []) {
      const deadlineTime = new Date(deadline.start_time);
      const hoursUntilDeadline = (deadlineTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Send notifications for deadlines within 24 hours or 7 days
      const shouldNotify = hoursUntilDeadline <= 24 || (hoursUntilDeadline <= 168 && hoursUntilDeadline >= 167);

      if (shouldNotify && deadline.clients?.assigned_agent) {
        // Create in-app notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: deadline.clients.assigned_agent,
            title: `Deadline Reminder: ${deadline.title}`,
            message: `Deadline for ${deadline.clients.name} is approaching on ${deadlineTime.toLocaleDateString()}`,
            type: hoursUntilDeadline <= 24 ? 'warning' : 'info',
            action_url: `/clients/${deadline.client_id}`,
          });

        if (!notificationError) {
          notificationsSent++;
        }

        // Send email notification if within 24 hours
        if (hoursUntilDeadline <= 24 && deadline.profiles?.email) {
          try {
            const emailResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
              },
              body: JSON.stringify({
                to: deadline.profiles.email,
                subject: `Urgent: Deadline Tomorrow - ${deadline.title}`,
                template: 'deadline-reminder',
                data: {
                  agentName: deadline.profiles.name,
                  clientName: deadline.clients.name,
                  deadlineTitle: deadline.title,
                  deadlineDate: deadlineTime.toLocaleDateString(),
                  deadlineTime: deadlineTime.toLocaleTimeString(),
                  clientUrl: `${process.env.NEXTAUTH_URL}/clients/${deadline.client_id}`,
                },
              }),
            });

            if (emailResponse.ok) {
              emailsSent++;
            }
          } catch (emailError) {
            console.error('Failed to send deadline email:', emailError);
          }
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      deadlinesChecked: upcomingDeadlines?.length || 0,
      notificationsSent,
      emailsSent,
    };

    console.log('Deadline reminders completed:', result);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Deadline reminders failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}