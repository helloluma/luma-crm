import { useEffect, useCallback, useRef } from 'react';
import { PerformanceMonitor } from '@/lib/performance';

/**
 * Hook for monitoring component performance
 */
export function usePerformanceMonitoring(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      const unmountTime = performance.now();
      const totalLifetime = unmountTime - mountTime.current;
      PerformanceMonitor.recordMetric(`${componentName}_lifetime`, totalLifetime);
    };
  }, [componentName]);

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      PerformanceMonitor.recordMetric(`${componentName}_render`, renderTime);
      renderStartTime.current = 0;
    }
  }, [componentName]);

  const measureAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const endTimer = PerformanceMonitor.start(`${componentName}_${operationName}`);
    try {
      const result = await operation();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }, [componentName]);

  const measureSync = useCallback(<T>(
    operation: () => T,
    operationName: string
  ): T => {
    const endTimer = PerformanceMonitor.start(`${componentName}_${operationName}`);
    try {
      const result = operation();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }, [componentName]);

  return {
    startRender,
    endRender,
    measureAsync,
    measureSync
  };
}

/**
 * Hook for monitoring API call performance
 */
export function useAPIPerformanceMonitoring() {
  const measureAPICall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const endTimer = PerformanceMonitor.start(`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`);
    
    try {
      const result = await apiCall();
      const duration = endTimer();
      
      // Log slow API calls
      if (duration > 2000) {
        console.warn(`Slow API call detected: ${endpoint} (${duration.toFixed(2)}ms)`);
      }
      
      return result;
    } catch (error) {
      endTimer();
      PerformanceMonitor.recordMetric(`api_error_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, 1);
      throw error;
    }
  }, []);

  return { measureAPICall };
}

/**
 * Hook for monitoring database query performance
 */
export function useQueryPerformanceMonitoring() {
  const measureQuery = useCallback(async <T>(
    query: () => Promise<T>,
    queryName: string
  ): Promise<T> => {
    const endTimer = PerformanceMonitor.start(`query_${queryName}`);
    
    try {
      const result = await query();
      const duration = endTimer();
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} (${duration.toFixed(2)}ms)`);
      }
      
      return result;
    } catch (error) {
      endTimer();
      PerformanceMonitor.recordMetric(`query_error_${queryName}`, 1);
      throw error;
    }
  }, []);

  return { measureQuery };
}

/**
 * Hook for getting performance statistics
 */
export function usePerformanceStats() {
  const getStats = useCallback(() => {
    return PerformanceMonitor.getAllStats();
  }, []);

  const getComponentStats = useCallback((componentName: string) => {
    return {
      render: PerformanceMonitor.getStats(`${componentName}_render`),
      lifetime: PerformanceMonitor.getStats(`${componentName}_lifetime`)
    };
  }, []);

  const clearStats = useCallback(() => {
    PerformanceMonitor.clear();
  }, []);

  return {
    getStats,
    getComponentStats,
    clearStats
  };
}

/**
 * Hook for Core Web Vitals monitoring
 */
export function useWebVitals() {
  useEffect(() => {
    // Monitor Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          PerformanceMonitor.recordMetric('lcp', entry.startTime);
        }
        
        if (entry.entryType === 'first-input') {
          PerformanceMonitor.recordMetric('fid', (entry as any).processingStart - entry.startTime);
        }
        
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          PerformanceMonitor.recordMetric('cls', (entry as any).value);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      // Browser doesn't support these metrics
      console.warn('Web Vitals monitoring not supported in this browser');
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const getWebVitals = useCallback(() => {
    return {
      lcp: PerformanceMonitor.getStats('lcp'),
      fid: PerformanceMonitor.getStats('fid'),
      cls: PerformanceMonitor.getStats('cls')
    };
  }, []);

  return { getWebVitals };
}