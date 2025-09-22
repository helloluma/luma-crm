import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor, errorTracker, userAnalytics } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    // Check if request is authorized (in production, add proper auth)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.MONITORING_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = {
      performance: performanceMonitor.getMetrics(),
      errors: errorTracker.getErrorSummary(),
      analytics: userAnalytics.getAnalytics(),
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(metrics, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Failed to get monitoring metrics:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Support POST for custom metric tracking
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.MONITORING_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'performance':
        if (data.endpoint && data.duration && data.status) {
          performanceMonitor.trackApiResponse(data.endpoint, data.duration, data.status);
        }
        break;

      case 'error':
        if (data.message) {
          errorTracker.trackError(data.message, data.context, data.severity || 'medium');
        }
        break;

      case 'analytics':
        if (data.sessionId && data.action) {
          userAnalytics.trackAction(data.sessionId, data.action, data.actionData);
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('Failed to track custom metric:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to track metric',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}