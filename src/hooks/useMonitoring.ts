import { useEffect, useCallback } from 'react';
import { performanceMonitor, errorTracker, userAnalytics } from '@/lib/monitoring';

// Hook for tracking page views
export function usePageTracking() {
  useEffect(() => {
    const sessionId = getSessionId();
    const path = window.location.pathname;
    
    userAnalytics.trackPageView(sessionId, path);
  }, []);
}

// Hook for tracking user actions
export function useActionTracking() {
  return useCallback((action: string, data?: any) => {
    const sessionId = getSessionId();
    userAnalytics.trackAction(sessionId, action, data);
  }, []);
}

// Hook for tracking API calls
export function useApiTracking() {
  return useCallback((endpoint: string, duration: number, status: number) => {
    performanceMonitor.trackApiResponse(endpoint, duration, status);
  }, []);
}

// Hook for error tracking
export function useErrorTracking() {
  return useCallback((
    error: Error | string,
    context?: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    errorTracker.trackError(error, context, severity);
  }, []);
}

// Hook for performance monitoring
export function usePerformanceTracking() {
  const trackRender = useCallback((componentName: string, renderTime: number) => {
    if (renderTime > 100) { // Track slow renders
      console.warn(`Slow render: ${componentName} took ${renderTime}ms`);
    }
  }, []);

  const trackInteraction = useCallback((interactionName: string, duration: number) => {
    if (duration > 500) { // Track slow interactions
      console.warn(`Slow interaction: ${interactionName} took ${duration}ms`);
    }
  }, []);

  return { trackRender, trackInteraction };
}

// Hook for monitoring Core Web Vitals
export function useWebVitals() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Track Largest Contentful Paint (LCP)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            const lcp = entry.startTime;
            console.log('LCP:', lcp);
            
            // Send to monitoring
            fetch('/api/monitoring/metrics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'performance',
                data: {
                  metric: 'lcp',
                  value: lcp,
                  timestamp: new Date().toISOString(),
                },
              }),
            }).catch(console.error);
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Track First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime;
          console.log('FID:', fid);
          
          fetch('/api/monitoring/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'performance',
              data: {
                metric: 'fid',
                value: fid,
                timestamp: new Date().toISOString(),
              },
            }),
          }).catch(console.error);
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cleanup
      return () => {
        observer.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
        
        // Send final CLS value
        if (clsValue > 0) {
          fetch('/api/monitoring/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'performance',
              data: {
                metric: 'cls',
                value: clsValue,
                timestamp: new Date().toISOString(),
              },
            }),
          }).catch(console.error);
        }
      };
    }
  }, []);
}

// Hook for monitoring component performance
export function useComponentPerformance(componentName: string) {
  const startTime = performance.now();

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // Longer than one frame (60fps)
      console.warn(`Component ${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  });

  const trackAction = useCallback((actionName: string) => {
    const actionStartTime = performance.now();
    
    return () => {
      const actionEndTime = performance.now();
      const actionDuration = actionEndTime - actionStartTime;
      
      if (actionDuration > 100) {
        console.warn(`Action ${actionName} in ${componentName} took ${actionDuration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);

  return { trackAction };
}

// Utility function to get or create session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = sessionStorage.getItem('monitoring-session-id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('monitoring-session-id', sessionId);
  }
  return sessionId;
}

// Hook for real-time monitoring dashboard
export function useMonitoringDashboard() {
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/metrics');
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch metrics');
    } catch (error) {
      console.error('Failed to fetch monitoring metrics:', error);
      return null;
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/health');
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch health status');
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      return null;
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/alerts');
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch alerts');
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return null;
    }
  }, []);

  return {
    fetchMetrics,
    fetchHealth,
    fetchAlerts,
  };
}