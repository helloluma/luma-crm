import { NextRequest, NextResponse } from 'next/server';
import { healthChecker } from '@/lib/monitoring';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Register health checks
healthChecker.registerCheck('database', 'Database Connection', async () => {
  try {
    const { error } = await supabase.from('profiles').select('id', { head: true }).limit(1);
    return !error;
  } catch {
    return false;
  }
});

healthChecker.registerCheck('storage', 'File Storage', async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    return !error && Array.isArray(data);
  } catch {
    return false;
  }
});

healthChecker.registerCheck('memory', 'Memory Usage', async () => {
  const memoryUsage = process.memoryUsage();
  const usedMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
  const totalMemoryMB = memoryUsage.heapTotal / 1024 / 1024;
  
  // Alert if memory usage is above 80%
  return (usedMemoryMB / totalMemoryMB) < 0.8;
});

healthChecker.registerCheck('external-services', 'External Services', async () => {
  try {
    // Check if we can reach external services
    const checks = [];
    
    // Check Resend (email service)
    if (process.env.RESEND_API_KEY) {
      checks.push(
        fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        }).then(res => res.ok).catch(() => false)
      );
    }
    
    // Check AWS SNS (SMS service)
    if (process.env.AWS_ACCESS_KEY_ID) {
      // For AWS, we'll just check if credentials are configured
      checks.push(Promise.resolve(true));
    }
    
    if (checks.length === 0) {
      return true; // No external services configured
    }
    
    const results = await Promise.all(checks);
    return results.every(result => result);
  } catch {
    return false;
  }
});

export async function GET(request: NextRequest) {
  try {
    const healthResults = await healthChecker.runAllChecks();
    
    const response = {
      ...healthResults,
      service: 'Real Estate CRM',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    };

    const statusCode = healthResults.healthy ? 200 : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const healthResults = await healthChecker.runAllChecks();
    const statusCode = healthResults.healthy ? 200 : 503;
    return new NextResponse(null, { status: statusCode });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}