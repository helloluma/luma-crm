import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ImageOptimizer,
  CacheManager,
  QueryOptimizer,
  PerformanceMonitor,
  ResponseOptimizer
} from '../performance';

describe('ImageOptimizer', () => {
  describe('generateSrcSet', () => {
    it('should generate correct srcset string', () => {
      const src = '/image.jpg';
      const sizes = [320, 640, 1024];
      const result = ImageOptimizer.generateSrcSet(src, sizes);
      
      expect(result).toBe('/image.jpg?w=320&q=75 320w, /image.jpg?w=640&q=75 640w, /image.jpg?w=1024&q=75 1024w');
    });
  });

  describe('getOptimalFormat', () => {
    it('should return avif for Chrome', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const result = ImageOptimizer.getOptimalFormat(userAgent);
      expect(result).toBe('avif');
    });

    it('should return webp for Firefox', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      const result = ImageOptimizer.getOptimalFormat(userAgent);
      expect(result).toBe('webp');
    });

    it('should return jpeg for unsupported browsers', () => {
      const userAgent = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)';
      const result = ImageOptimizer.getOptimalFormat(userAgent);
      expect(result).toBe('jpeg');
    });
  });

  describe('optimizeImageUrl', () => {
    it('should generate optimized image URL', () => {
      const src = '/image.jpg';
      const options = { width: 800, height: 600, quality: 80, format: 'webp' };
      const result = ImageOptimizer.optimizeImageUrl(src, options);
      
      expect(result).toContain('w=800');
      expect(result).toContain('h=600');
      expect(result).toContain('q=80');
      expect(result).toContain('f=webp');
    });

    it('should use default quality when not specified', () => {
      const src = '/image.jpg';
      const result = ImageOptimizer.optimizeImageUrl(src, { width: 800 });
      
      expect(result).toContain('q=75');
    });
  });
});

describe('CacheManager', () => {
  beforeEach(() => {
    CacheManager.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve cache entries', () => {
      const key = 'test-key';
      const data = { message: 'test data' };
      
      CacheManager.set(key, data, 1000);
      const result = CacheManager.get(key);
      
      expect(result).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const result = CacheManager.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return null for expired entries', async () => {
      const key = 'test-key';
      const data = { message: 'test data' };
      
      CacheManager.set(key, data, 1); // 1ms TTL
      
      await new Promise(resolve => setTimeout(resolve, 5));
      
      const result = CacheManager.get(key);
      expect(result).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      CacheManager.set('key1', 'data1', 1);
      CacheManager.set('key2', 'data2', 10000);
      
      await new Promise(resolve => setTimeout(resolve, 5));
      
      CacheManager.cleanup();
      
      expect(CacheManager.get('key1')).toBeNull();
      expect(CacheManager.get('key2')).toBe('data2');
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      CacheManager.set('key1', 'data1');
      CacheManager.set('key2', 'data2');
      
      const stats = CacheManager.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });
  });
});

describe('QueryOptimizer', () => {
  describe('optimizeSelect', () => {
    it('should generate basic select query', () => {
      const fields = ['id', 'name', 'email'];
      const result = QueryOptimizer.optimizeSelect(fields);
      
      expect(result).toBe('id, name, email');
    });

    it('should include relations in select query', () => {
      const fields = ['id', 'name'];
      const relations = {
        profile: ['avatar_url', 'role'],
        transactions: ['id', 'amount']
      };
      
      const result = QueryOptimizer.optimizeSelect(fields, relations);
      
      expect(result).toContain('id, name');
      expect(result).toContain('profile(avatar_url, role)');
      expect(result).toContain('transactions(id, amount)');
    });
  });

  describe('getPaginationParams', () => {
    it('should calculate correct pagination parameters', () => {
      const result = QueryOptimizer.getPaginationParams(2, 10);
      
      expect(result.from).toBe(10);
      expect(result.to).toBe(19);
    });

    it('should use default values', () => {
      const result = QueryOptimizer.getPaginationParams();
      
      expect(result.from).toBe(0);
      expect(result.to).toBe(19);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const table = 'users';
      const filters = { active: true, role: 'admin' };
      const options = { limit: 10, offset: 0 };
      
      const key1 = QueryOptimizer.generateCacheKey(table, filters, options);
      const key2 = QueryOptimizer.generateCacheKey(table, filters, options);
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const table = 'users';
      const filters1 = { active: true };
      const filters2 = { active: false };
      
      const key1 = QueryOptimizer.generateCacheKey(table, filters1);
      const key2 = QueryOptimizer.generateCacheKey(table, filters2);
      
      expect(key1).not.toBe(key2);
    });
  });
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clear();
  });

  describe('start and recordMetric', () => {
    it('should measure execution time', () => {
      const endTimer = PerformanceMonitor.start('test-operation');
      
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Wait for at least 10ms
      }
      
      const duration = endTimer();
      
      expect(duration).toBeGreaterThan(0);
      
      const stats = PerformanceMonitor.getStats('test-operation');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
    });

    it('should record multiple metrics', () => {
      PerformanceMonitor.recordMetric('test-metric', 100);
      PerformanceMonitor.recordMetric('test-metric', 200);
      PerformanceMonitor.recordMetric('test-metric', 150);
      
      const stats = PerformanceMonitor.getStats('test-metric');
      
      expect(stats!.count).toBe(3);
      expect(stats!.avg).toBe(150);
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(200);
    });
  });

  describe('getStats', () => {
    it('should return null for non-existent metrics', () => {
      const stats = PerformanceMonitor.getStats('non-existent');
      expect(stats).toBeNull();
    });

    it('should calculate percentiles correctly', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      
      values.forEach(value => {
        PerformanceMonitor.recordMetric('percentile-test', value);
      });
      
      const stats = PerformanceMonitor.getStats('percentile-test');
      
      expect(stats!.p95).toBe(100); // 95th percentile should be 100
    });
  });

  describe('getAllStats', () => {
    it('should return all recorded metrics', () => {
      PerformanceMonitor.recordMetric('metric1', 100);
      PerformanceMonitor.recordMetric('metric2', 200);
      
      const allStats = PerformanceMonitor.getAllStats();
      
      expect(allStats).toHaveProperty('metric1');
      expect(allStats).toHaveProperty('metric2');
    });
  });
});

describe('ResponseOptimizer', () => {
  describe('optimizeJsonResponse', () => {
    it('should remove null values', () => {
      const data = {
        name: 'John',
        email: null,
        age: 30,
        address: {
          street: '123 Main St',
          city: null,
          country: 'USA'
        },
        hobbies: ['reading', null, 'swimming']
      };
      
      const result = ResponseOptimizer.optimizeJsonResponse(data);
      
      expect(result.email).toBeUndefined();
      expect(result.address.city).toBeUndefined();
      expect(result.address.street).toBe('123 Main St');
      expect(result.hobbies).toEqual(['reading', 'swimming']);
    });

    it('should handle arrays correctly', () => {
      const data = [
        { id: 1, name: 'Item 1', description: null },
        { id: 2, name: 'Item 2', description: 'Valid description' }
      ];
      
      const result = ResponseOptimizer.optimizeJsonResponse(data);
      
      expect(result[0].description).toBeUndefined();
      expect(result[1].description).toBe('Valid description');
    });
  });
});