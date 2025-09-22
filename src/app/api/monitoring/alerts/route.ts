import { NextRequest, NextResponse } from 'next/server';
import { errorTracker, performanceMonitor } from '@/lib/monitoring';

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

// Define alert rules
const alertRules: AlertRule[] = [
  {
    id: 'high_error_rate',
    name: 'High Error Rate',
    condition: (metrics) => {
      const errorSummary = metrics.errors;
      return errorSummary.lastHour > 10; // More than 10 errors in the last hour
    },
    severity: 'high',
    message: 'High error rate detected: {errorCount} errors in the last hour',
  },
  {
    id: 'slow_api_response',
    name: 'Slow API Response',
    condition: (metrics) => {
      const performance = metrics.performance;
      for (const [key, data] of Object.entries(performance)) {
        if (key.startsWith('api_') && (data as any).p95 > 5000) {
          return true; // 95th percentile response time > 5 seconds
        }
      }
      return false;
    },
    severity: 'medium',
    message: 'API response times are slow (95th percentile > 5 seconds)',
  },
  {
    id: 'high_memory_usage',
    name: 'High Memory Usage',
    condition: (metrics) => {
      const memory = metrics.system.memory;
      return (memory.used / memory.total) > 0.85; // Memory usage > 85%
    },
    severity: 'medium',
    message: 'High memory usage detected: {memoryUsage}% of available memory',
  },
  {
    id: 'critical_errors',
    name: 'Critical Errors',
    condition: (metrics) => {
      const errorSummary = metrics.errors;
      return errorSummary.bySeverity?.critical > 0;
    },
    severity: 'critical',
    message: 'Critical errors detected: {criticalCount} critical errors',
  },
  {
    id: 'database_slow_queries',
    name: 'Slow Database Queries',
    condition: (metrics) => {
      const performance = metrics.performance;
      const dbMetrics = performance.db_query;
      return dbMetrics && dbMetrics.p95 > 2000; // 95th percentile > 2 seconds
    },
    severity: 'medium',
    message: 'Database queries are slow (95th percentile > 2 seconds)',
  },
];

// Store active alerts (in production, use a database or external service)
const activeAlerts = new Map<string, {
  rule: AlertRule;
  triggeredAt: string;
  lastNotified: string;
  count: number;
}>();

async function sendAlert(alert: AlertRule, metrics: any) {
  const alertData = {
    id: alert.id,
    name: alert.name,
    severity: alert.severity,
    message: alert.message,
    metrics: metrics,
    timestamp: new Date().toISOString(),
  };

  console.log(`🚨 ALERT: ${alert.name} (${alert.severity})`, alertData);

  // Send to Slack if webhook is configured
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const slackMessage = {
        text: `🚨 Alert: ${alert.name}`,
        attachments: [
          {
            color: alert.severity === 'critical' ? 'danger' : 
                   alert.severity === 'high' ? 'warning' : 'good',
            fields: [
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Message',
                value: alert.message,
                short: false,
              },
              {
                title: 'Timestamp',
                value: new Date().toISOString(),
                short: true,
              },
            ],
          },
        ],
      };

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  // Send email alert for critical issues
  if (alert.severity === 'critical' && process.env.ADMIN_EMAIL) {
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`,
        },
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL,
          subject: `🚨 Critical Alert: ${alert.name}`,
          template: 'alert',
          data: alertData,
        }),
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.MONITORING_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current metrics
    const metrics = {
      performance: performanceMonitor.getMetrics(),
      errors: errorTracker.getErrorSummary(),
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    };

    const triggeredAlerts = [];
    const resolvedAlerts = [];

    // Check each alert rule
    for (const rule of alertRules) {
      const isTriggered = rule.condition(metrics);
      const existingAlert = activeAlerts.get(rule.id);

      if (isTriggered) {
        if (!existingAlert) {
          // New alert
          const newAlert = {
            rule,
            triggeredAt: new Date().toISOString(),
            lastNotified: new Date().toISOString(),
            count: 1,
          };
          activeAlerts.set(rule.id, newAlert);
          triggeredAlerts.push(newAlert);
          
          // Send notification
          await sendAlert(rule, metrics);
        } else {
          // Existing alert - increment count
          existingAlert.count++;
          
          // Re-notify for critical alerts every 15 minutes
          const lastNotified = new Date(existingAlert.lastNotified);
          const now = new Date();
          const minutesSinceLastNotification = (now.getTime() - lastNotified.getTime()) / (1000 * 60);
          
          if (rule.severity === 'critical' && minutesSinceLastNotification >= 15) {
            existingAlert.lastNotified = now.toISOString();
            await sendAlert(rule, metrics);
          }
        }
      } else if (existingAlert) {
        // Alert resolved
        resolvedAlerts.push(existingAlert);
        activeAlerts.delete(rule.id);
        
        console.log(`✅ Alert resolved: ${rule.name}`);
        
        // Send resolution notification for critical alerts
        if (rule.severity === 'critical' && process.env.SLACK_WEBHOOK_URL) {
          try {
            await fetch(process.env.SLACK_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `✅ Alert resolved: ${rule.name}`,
                attachments: [
                  {
                    color: 'good',
                    fields: [
                      {
                        title: 'Duration',
                        value: `${Math.round((Date.now() - new Date(existingAlert.triggeredAt).getTime()) / 1000 / 60)} minutes`,
                        short: true,
                      },
                      {
                        title: 'Occurrences',
                        value: existingAlert.count.toString(),
                        short: true,
                      },
                    ],
                  },
                ],
              }),
            });
          } catch (error) {
            console.error('Failed to send resolution notification:', error);
          }
        }
      }
    }

    const response = {
      activeAlerts: Array.from(activeAlerts.values()),
      triggeredAlerts,
      resolvedAlerts,
      totalActiveAlerts: activeAlerts.size,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Alert check failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to check alerts',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Manual alert trigger for testing
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.MONITORING_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, testMessage } = body;

    if (alertId) {
      const rule = alertRules.find(r => r.id === alertId);
      if (rule) {
        await sendAlert(rule, { test: true, message: testMessage });
        return NextResponse.json({ success: true, message: 'Test alert sent' });
      } else {
        return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Missing alertId' }, { status: 400 });

  } catch (error) {
    console.error('Failed to send test alert:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to send test alert',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}