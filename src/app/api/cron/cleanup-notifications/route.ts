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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete read notifications older than 30 days
    const { data: deletedNotifications, error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('read', true)
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id');

    if (deleteError) {
      throw new Error(`Failed to delete old notifications: ${deleteError.message}`);
    }

    // Delete unread notifications older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: deletedUnread, error: deleteUnreadError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('id');

    if (deleteUnreadError) {
      throw new Error(`Failed to delete old unread notifications: ${deleteUnreadError.message}`);
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      deletedReadNotifications: deletedNotifications?.length || 0,
      deletedUnreadNotifications: deletedUnread?.length || 0,
      totalDeleted: (deletedNotifications?.length || 0) + (deletedUnread?.length || 0),
    };

    console.log('Notification cleanup completed:', result);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Notification cleanup failed:', error);
    
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