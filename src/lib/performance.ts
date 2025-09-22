import { lazy, ComponentType } from 'react';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Performance optimization utilities
 */

// Lazy loading utilities
export const lazyLoad = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
) => {
  const LazyComponent = lazy(importFunc);
  
  if (fallback) {
    LazyComponent.displayName = `Lazy(${fallback.displayName || fallback.name || 'Component'})`;
  }
  
  return LazyComponent;
};

// Image optimization utilities
export class ImageOptimizer {
  /**
   * Generate responsive image sizes
   */
  static generateSrcSet(src: string, sizes: number[]): string {
    return sizes
      .map(size => `${src}?w=${size}&q=75 ${size}w`)
      .join(', ');
  }

  /**
   * Get optimal image format based on browser support
   */
  static getOptimalFormat(userAgent: string): 'webp' | 'avif' | 'jpeg' {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
      return 'avif';
    }
    if (userAgent.includes('Chrome') || userAgent.includes('Firefox') || userAgent.includes('Safari')) {
      return 'webp';
    }
    return 'jpeg';
  }

  /**
   * Generate image URL with optimizations
   */
  static optimizeImageUrl(
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    } = {}
  ): string {
    const { width, height, quality = 75, format } = options;
    const url = new URL(src, 'https://example.com');
    
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    if (quality) url.searchParams.set('q', quality.toString());
    if (format) url.searchParams.set('f', format);
    
    return url.toString().replace('https://example.com', '');
  }
}

// Caching utilities
export class CacheManager {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * Set cache entry with TTL
   */
  static set(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  /**
   * Get cache entry if not expired
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Clear expired entries
   */
  static cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Database query optimization
export class QueryOptimizer {
  /**
   * Generate optimized Supabase select query
   */
  static optimizeSelect(
    fields: string[],
    relations?: Record<string, string[]>
  ): string {
    let query = fields.join(', ');
    
    if (relations) {
      const relationQueries = Object.entries(relations).map(([table, relFields]) => {
        return `${table}(${relFields.join(', ')})`;
      });
      
      if (relationQueries.length > 0) {
        query += ', ' + relationQueries.join(', ');
      }
    }
    
    return query;
  }

  /**
   * Generate pagination parameters
   */
  static getPaginationParams(
    page: number = 1,
    limit: number = 20
  ): { from: number; to: number } {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    return { from, to };
  }

  /**
   * Generate cache key for query
   */
  static generateCacheKey(
    table: string,
    filters: Record<string, any> = {},
    options: Record<string, any> = {}
  ): string {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
      .join('|');
    
    const optionsStr = Object.entries(options)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
      .join('|');
    
    return `${table}:${filterStr}:${optionsStr}`;
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  /**
   * Start performance measurement
   */
  static start(label: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  /**
   * Record performance metric
   */
  static recordMetric(label: string, duration: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const metrics = this.metrics.get(label)!;
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance statistics
   */
  static getStats(label: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const metrics = this.metrics.get(label);
    
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const count = metrics.length;
    const avg = metrics.reduce((sum, val) => sum + val, 0) / count;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, avg, min, max, p95 };
  }

  /**
   * Get all performance metrics
   */
  static getAllStats(): Record<string, ReturnType<typeof PerformanceMonitor.getStats>> {
    const stats: Record<string, any> = {};
    
    for (const label of this.metrics.keys()) {
      stats[label] = this.getStats(label);
    }
    
    return stats;
  }

  /**
   * Clear performance metrics
   */
  static clear(): void {
    this.metrics.clear();
  }
}

// Response compression and optimization
export class ResponseOptimizer {
  /**
   * Add performance headers to response
   */
  static addPerformanceHeaders(response: NextResponse): NextResponse {
    // Cache control headers
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    
    // Compression hints
    response.headers.set('Vary', 'Accept-Encoding');
    
    // Resource hints
    response.headers.set('Link', [
      '</api/dashboard/metrics>; rel=prefetch',
      '</api/clients>; rel=prefetch',
      '</fonts/inter.woff2>; rel=preload; as=font; type=font/woff2; crossorigin'
    ].join(', '));
    
    return response;
  }

  /**
   * Optimize JSON response
   */
  static optimizeJsonResponse(data: any): any {
    // Remove null values to reduce payload size
    const removeNulls = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj
          .filter(item => item !== null && item !== undefined)
          .map(removeNulls);
      }
      
      if (obj && typeof obj === 'object') {
        const cleaned: any = {};
        
        for (const [key, value] of Object.entries(obj)) {
          if (value !== null && value !== undefined) {
            cleaned[key] = removeNulls(value);
          }
        }
        
        return cleaned;
      }
      
      return obj;
    };

    return removeNulls(data);
  }

  /**
   * Create optimized API response
   */
  static createOptimizedResponse(
    data: any,
    options: {
      status?: number;
      cacheMaxAge?: number;
      compress?: boolean;
    } = {}
  ): NextResponse {
    const { status = 200, cacheMaxAge = 3600, compress = true } = options;
    
    const optimizedData = compress ? this.optimizeJsonResponse(data) : data;
    const response = NextResponse.json(optimizedData, { status });
    
    // Add cache headers
    response.headers.set(
      'Cache-Control',
      `public, max-age=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 24}`
    );
    
    // Add compression headers
    if (compress) {
      response.headers.set('Content-Encoding', 'gzip');
    }
    
    return response;
  }
}

// Bundle analysis utilities
export class BundleAnalyzer {
  /**
   * Analyze component bundle size (development only)
   */
  static analyzeComponent(componentName: string, size: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Component ${componentName}: ${(size / 1024).toFixed(2)}KB`);
      
      if (size > 100 * 1024) { // 100KB
        console.warn(`⚠️  Large component detected: ${componentName} (${(size / 1024).toFixed(2)}KB)`);
      }
    }
  }

  /**
   * Track dynamic imports
   */
  static trackDynamicImport(moduleName: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Dynamic import: ${moduleName}`);
    }
  }
}

// Cleanup expired cache entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    CacheManager.cleanup();
  }, 5 * 60 * 1000);
}