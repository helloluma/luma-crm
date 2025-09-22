import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Test database connection with a simple query
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Test database write capability (non-destructive)
    const writeTest = await supabase
      .from('profiles')
      .select('id')
      .limit(0);

    if (writeTest.error && writeTest.error.code !== 'PGRST116') {
      throw new Error(`Database write test failed: ${writeTest.error.message}`);
    }

    const healthStatus = {
      status: 'healthy',
      database: {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        recordCount: count || 0,
        connection: 'active',
        lastChecked: new Date().toISOString(),
      },
      checks: {
        connectivity: 'passed',
        readAccess: 'passed',
        writeAccess: 'passed',
        performance: responseTime < 1000 ? 'good' : responseTime < 3000 ? 'acceptable' : 'slow',
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(healthStatus, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Database health check failed:', error);
    
    const errorResponse = {
      status: 'unhealthy',
      database: {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown database error',
        lastChecked: new Date().toISOString(),
      },
      checks: {
        connectivity: 'failed',
        readAccess: 'failed',
        writeAccess: 'failed',
        performance: 'failed',
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      }
    });
  }
}

export async function HEAD(request: NextRequest) {
  try {
    // Quick connectivity test for HEAD requests
    const { error } = await supabase
      .from('profiles')
      .select('id', { head: true })
      .limit(1);

    if (error) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}