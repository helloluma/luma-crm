import { NextRequest } from 'next/server';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private errorCounts: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track API response times
  trackApiResponse(endpoint: string, duration: number, status: number) {
    const key = `api_${endpoint}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metrics = this.metrics.get(key)!;
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Track errors
    if (status >= 400) {
      const errorKey = `error_${endpoint}_${status}`;
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    }

    // Log slow requests
    if (duration > 5000) {
      console.warn(`Slow API request: ${endpoint} took ${duration}ms`);
    }
  }

  // Track database query performance
  trackDatabaseQuery(query: string, duration: number) {
    const key = `db_query`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metrics = this.metrics.get(key)!;
    metrics.push(duration);
    
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow database query: ${query.substring(0, 100)}... took ${duration}ms`);
    }
  }

  // Get performance metrics
  getMetrics() {
    const result: Record<string, any> = {};
    
    for (const [key, values] of this.metrics.entries()) {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        result[key] = {
          count: values.length,
          avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
          min: Math.min(...values),
          max: Math.max(...values),
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
        };
      }
    }

    return {
      performance: result,
      errors: Object.fromEntries(this.errorCounts),
      timestamp: new Date().toISOString(),
    };
  }

  // Reset metrics (useful for testing)
  reset() {
    this.metrics.clear();
    this.errorCounts.clear();
  }
}

// Error tracking utilities
export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: Array<{
    message: string;
    stack?: string;
    timestamp: string;
    context?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> = [];

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  // Track application errors
  trackError(
    error: Error | string,
    context?: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    const errorEntry = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      context,
      severity,
    };

    this.errors.push(errorEntry);

    // Keep only last 1000 errors
    if (this.errors.length > 1000) {
      this.errors.shift();
    }

    // Log to console based on severity
    if (severity === 'critical' || severity === 'high') {
      console.error('Application Error:', errorEntry);
    } else {
      console.warn('Application Warning:', errorEntry);
    }

    // Send to external error tracking service in production
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      this.sendToSentry(errorEntry);
    }
  }

  private async sendToSentry(errorEntry: any) {
    try {
      // This would integrate with Sentry or similar service
      // For now, just log that we would send it
      console.log('Would send to Sentry:', errorEntry.message);
    } catch (err) {
      console.error('Failed to send error to Sentry:', err);
    }
  }

  // Get recent errors
  getErrors(limit = 100) {
    return this.errors.slice(-limit);
  }

  // Get error summary
  getErrorSummary() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentErrors = this.errors.filter(
      error => new Date(error.timestamp) > oneHourAgo
    );
    const dailyErrors = this.errors.filter(
      error => new Date(error.timestamp) > oneDayAgo
    );

    const severityCounts = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errors.length,
      lastHour: recentErrors.length,
      lastDay: dailyErrors.length,
      bySeverity: severityCounts,
      timestamp: new Date().toISOString(),
    };
  }
}

// User analytics tracking
export class UserAnalytics {
  private static instance: UserAnalytics;
  private sessions: Map<string, {
    userId?: string;
    startTime: string;
    lastActivity: string;
    pageViews: number;
    actions: string[];
  }> = new Map();

  static getInstance(): UserAnalytics {
    if (!UserAnalytics.instance) {
      UserAnalytics.instance = new UserAnalytics();
    }
    return UserAnalytics.instance;
  }

  // Track user session
  trackSession(sessionId: string, userId?: string) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        userId,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        pageViews: 0,
        actions: [],
      });
    }
  }

  // Track page view
  trackPageView(sessionId: string, path: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pageViews++;
      session.lastActivity = new Date().toISOString();
      session.actions.push(`page_view:${path}`);
    }
  }

  // Track user action
  trackAction(sessionId: string, action: string, data?: any) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date().toISOString();
      session.actions.push(`action:${action}${data ? `:${JSON.stringify(data)}` : ''}`);
    }
  }

  // Get analytics summary
  getAnalytics() {
    const now = new Date();
    const activeSessions = Array.from(this.sessions.values()).filter(
      session => new Date(session.lastActivity) > new Date(now.getTime() - 30 * 60 * 1000)
    );

    const totalPageViews = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.pageViews, 0);

    return {
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      totalPageViews,
      averagePageViewsPerSession: totalPageViews / Math.max(this.sessions.size, 1),
      timestamp: new Date().toISOString(),
    };
  }
}

// Health check utilities
export class HealthChecker {
  private static instance: HealthChecker;
  private checks: Map<string, {
    name: string;
    check: () => Promise<boolean>;
    lastResult?: boolean;
    lastCheck?: string;
    errorMessage?: string;
  }> = new Map();

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  // Register a health check
  registerCheck(
    id: string,
    name: string,
    check: () => Promise<boolean>
  ) {
    this.checks.set(id, { name, check });
  }

  // Run all health checks
  async runAllChecks(): Promise<{
    healthy: boolean;
    checks: Record<string, any>;
    timestamp: string;
  }> {
    const results: Record<string, any> = {};
    let allHealthy = true;

    for (const [id, checkConfig] of this.checks.entries()) {
      try {
        const startTime = Date.now();
        const result = await checkConfig.check();
        const duration = Date.now() - startTime;

        checkConfig.lastResult = result;
        checkConfig.lastCheck = new Date().toISOString();
        checkConfig.errorMessage = undefined;

        results[id] = {
          name: checkConfig.name,
          healthy: result,
          duration,
          lastCheck: checkConfig.lastCheck,
        };

        if (!result) {
          allHealthy = false;
        }
      } catch (error) {
        checkConfig.lastResult = false;
        checkConfig.lastCheck = new Date().toISOString();
        checkConfig.errorMessage = error instanceof Error ? error.message : 'Unknown error';

        results[id] = {
          name: checkConfig.name,
          healthy: false,
          error: checkConfig.errorMessage,
          lastCheck: checkConfig.lastCheck,
        };

        allHealthy = false;
      }
    }

    return {
      healthy: allHealthy,
      checks: results,
      timestamp: new Date().toISOString(),
    };
  }
}

// Middleware for request monitoring
export function createMonitoringMiddleware() {
  const performanceMonitor = PerformanceMonitor.getInstance();
  const errorTracker = ErrorTracker.getInstance();
  const userAnalytics = UserAnalytics.getInstance();

  return (request: NextRequest) => {
    const startTime = Date.now();
    const sessionId = request.headers.get('x-session-id') || 'anonymous';
    const path = request.nextUrl.pathname;

    // Track session and page view
    userAnalytics.trackSession(sessionId);
    userAnalytics.trackPageView(sessionId, path);

    // Return cleanup function
    return (response: Response) => {
      const duration = Date.now() - startTime;
      const status = response.status;

      // Track API performance
      if (path.startsWith('/api/')) {
        performanceMonitor.trackApiResponse(path, duration, status);
      }

      // Track errors
      if (status >= 500) {
        errorTracker.trackError(
          `HTTP ${status} error on ${path}`,
          { path, duration, status },
          'high'
        );
      } else if (status >= 400) {
        errorTracker.trackError(
          `HTTP ${status} error on ${path}`,
          { path, duration, status },
          'medium'
        );
      }
    };
  };
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const errorTracker = ErrorTracker.getInstance();
export const userAnalytics = UserAnalytics.getInstance();
export const healthChecker = HealthChecker.getInstance();