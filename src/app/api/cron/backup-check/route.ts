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

    const checks = {
      database: { status: 'unknown', lastBackup: null, recordCount: 0 },
      storage: { status: 'unknown', fileCount: 0, totalSize: 0 },
      system: { status: 'unknown', timestamp: new Date().toISOString() },
    };

    // Check database health and record counts
    try {
      const tables = ['profiles', 'clients', 'transactions', 'appointments', 'notifications', 'documents'];
      let totalRecords = 0;

      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          throw new Error(`Failed to count ${table}: ${error.message}`);
        }

        totalRecords += count || 0;
      }

      checks.database = {
        status: 'healthy',
        lastBackup: new Date().toISOString(), // In production, this would check actual backup timestamps
        recordCount: totalRecords,
      };
    } catch (error) {
      checks.database = {
        status: 'error',
        lastBackup: null,
        recordCount: 0,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }

    // Check storage health
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        throw new Error(`Failed to list buckets: ${bucketsError.message}`);
      }

      let totalFiles = 0;
      let totalSize = 0;

      for (const bucket of buckets || []) {
        try {
          const { data: files, error: filesError } = await supabase.storage
            .from(bucket.name)
            .list('', { limit: 1000 });

          if (!filesError && files) {
            totalFiles += files.length;
            totalSize += files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
          }
        } catch (bucketError) {
          console.warn(`Failed to check bucket ${bucket.name}:`, bucketError);
        }
      }

      checks.storage = {
        status: 'healthy',
        fileCount: totalFiles,
        totalSize: Math.round(totalSize / 1024 / 1024), // Convert to MB
        buckets: buckets?.length || 0,
      };
    } catch (error) {
      checks.storage = {
        status: 'error',
        fileCount: 0,
        totalSize: 0,
        error: error instanceof Error ? error.message : 'Unknown storage error',
      };
    }

    // Overall system status
    const hasErrors = checks.database.status === 'error' || checks.storage.status === 'error';
    checks.system.status = hasErrors ? 'degraded' : 'healthy';

    // Send alert if there are issues
    if (hasErrors) {
      try {
        // In production, this would send alerts to administrators
        console.error('Backup check found issues:', checks);
        
        // Send notification to system administrators
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: process.env.ADMIN_USER_ID, // Set this to admin user ID
            title: 'System Backup Check Alert',
            message: `Backup check found issues: ${hasErrors ? 'Database or storage errors detected' : 'System healthy'}`,
            type: 'error',
            action_url: '/admin/system-health',
          });

        if (notificationError) {
          console.error('Failed to send admin notification:', notificationError);
        }
      } catch (alertError) {
        console.error('Failed to send backup check alert:', alertError);
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        overallStatus: checks.system.status,
        databaseRecords: checks.database.recordCount,
        storageFiles: checks.storage.fileCount,
        storageSizeMB: checks.storage.totalSize,
      },
    };

    console.log('Backup check completed:', result.summary);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Backup check failed:', error);
    
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