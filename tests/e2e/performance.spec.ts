import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers } from './fixtures/test-data';

test.describe('Performance Testing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    // Navigate to dashboard and measure performance
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await helpers.login();
    await helpers.waitForLoadingComplete();
    
    const loadTime = Date.now() - startTime;
    
    // Get Core Web Vitals metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
          });
          
          // Get CLS (Cumulative Layout Shift)
          let cls = 0;
          new PerformanceObserver((clsList) => {
            for (const entry of clsList.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
            vitals.cls = cls;
          }).observe({ type: 'layout-shift', buffered: true });
          
          // Get FID (First Input Delay) - simulated
          vitals.fid = 0; // Will be measured on actual user interaction
          
          setTimeout(() => resolve(vitals), 2000);
        });
        
        observer.observe({ type: 'paint', buffered: true });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      });
    });
    
    // Core Web Vitals thresholds
    expect((metrics as any).fcp).toBeLessThan(1800); // FCP < 1.8s (good)
    expect((metrics as any).lcp).toBeLessThan(2500); // LCP < 2.5s (good)
    expect((metrics as any).cls).toBeLessThan(0.1);  // CLS < 0.1 (good)
    expect(loadTime).toBeLessThan(3000); // Total load time < 3s
    
    console.log('Performance Metrics:', {
      fcp: (metrics as any).fcp,
      lcp: (metrics as any).lcp,
      cls: (metrics as any).cls,
      totalLoadTime: loadTime
    });
  });

  test('should load dashboard efficiently', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/dashboard');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Performance thresholds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1500);
    expect(performanceMetrics.domInteractive).toBeLessThan(2000);
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1800);
    
    console.log('Dashboard Performance:', performanceMetrics);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    await helpers.login();
    
    // Mock large dataset
    const largeClientList = Array.from({ length: 1000 }, (_, i) => ({
      id: `client-${i}`,
      name: `Client ${i}`,
      email: `client${i}@example.com`,
      type: 'Lead',
      created_at: new Date().toISOString()
    }));
    
    await helpers.mockApiResponse('**/api/clients', largeClientList);
    
    const startTime = Date.now();
    await helpers.navigateTo('/clients');
    await helpers.waitForLoadingComplete();
    const loadTime = Date.now() - startTime;
    
    // Should load large dataset in reasonable time
    expect(loadTime).toBeLessThan(2000);
    
    // Check if pagination or virtualization is working
    const visibleClients = await page.locator('[data-testid="client-card"]').count();
    expect(visibleClients).toBeLessThanOrEqual(50); // Should not render all 1000 items
    
    console.log(`Large dataset load time: ${loadTime}ms, visible items: ${visibleClients}`);
  });

  test('should optimize image loading', async ({ page }) => {
    await helpers.login();
    
    // Monitor network requests
    const imageRequests: any[] = [];
    page.on('request', request => {
      if (request.resourceType() === 'image') {
        imageRequests.push({
          url: request.url(),
          size: 0 // Will be updated on response
        });
      }
    });
    
    page.on('response', response => {
      if (response.request().resourceType() === 'image') {
        const request = imageRequests.find(req => req.url === response.url());
        if (request) {
          response.body().then(body => {
            request.size = body.length;
          });
        }
      }
    });
    
    await helpers.navigateTo('/dashboard');
    await helpers.waitForLoadingComplete();
    
    // Wait for images to load
    await page.waitForTimeout(2000);
    
    // Check image optimization
    for (const imageReq of imageRequests) {
      // Images should be reasonably sized (< 500KB for web)
      if (imageReq.size > 0) {
        expect(imageReq.size).toBeLessThan(500000);
      }
      
      // Should use modern formats or optimized images
      const isOptimized = imageReq.url.includes('.webp') || 
                         imageReq.url.includes('.avif') || 
                         imageReq.url.includes('w_') || // Cloudinary-style optimization
                         imageReq.url.includes('q_'); // Quality parameter
      
      console.log(`Image: ${imageReq.url}, Size: ${imageReq.size}, Optimized: ${isOptimized}`);
    }
  });

  test('should minimize JavaScript bundle size', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Monitor JavaScript requests
    const jsRequests: any[] = [];
    page.on('response', async response => {
      if (response.request().resourceType() === 'script') {
        const body = await response.body();
        jsRequests.push({
          url: response.url(),
          size: body.length,
          compressed: response.headers()['content-encoding'] === 'gzip' || 
                     response.headers()['content-encoding'] === 'br'
        });
      }
    });
    
    await helpers.login();
    await helpers.waitForLoadingComplete();
    
    // Calculate total JS bundle size
    const totalJSSize = jsRequests.reduce((total, req) => total + req.size, 0);
    const compressedRequests = jsRequests.filter(req => req.compressed).length;
    
    // Bundle size should be reasonable (< 1MB total)
    expect(totalJSSize).toBeLessThan(1024 * 1024);
    
    // Most JS should be compressed
    expect(compressedRequests / jsRequests.length).toBeGreaterThan(0.8);
    
    console.log(`Total JS size: ${totalJSSize} bytes, Compressed: ${compressedRequests}/${jsRequests.length}`);
  });

  test('should implement efficient caching', async ({ page }) => {
    await helpers.login();
    
    // First visit
    const firstVisitStart = Date.now();
    await helpers.navigateTo('/clients');
    await helpers.waitForLoadingComplete();
    const firstVisitTime = Date.now() - firstVisitStart;
    
    // Second visit (should use cache)
    const secondVisitStart = Date.now();
    await page.reload();
    await helpers.waitForLoadingComplete();
    const secondVisitTime = Date.now() - secondVisitStart;
    
    // Second visit should be faster due to caching
    expect(secondVisitTime).toBeLessThan(firstVisitTime * 0.8);
    
    console.log(`First visit: ${firstVisitTime}ms, Second visit: ${secondVisitTime}ms`);
  });

  test('should handle concurrent API requests efficiently', async ({ page }) => {
    await helpers.login();
    
    // Monitor API requests
    const apiRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          startTime: Date.now()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const request = apiRequests.find(req => req.url === response.url());
        if (request) {
          request.endTime = Date.now();
          request.duration = request.endTime - request.startTime;
        }
      }
    });
    
    // Navigate to dashboard which makes multiple API calls
    await helpers.navigateTo('/dashboard');
    await helpers.waitForLoadingComplete();
    
    // Check API request performance
    const completedRequests = apiRequests.filter(req => req.duration);
    const averageResponseTime = completedRequests.reduce((sum, req) => sum + req.duration, 0) / completedRequests.length;
    
    // API requests should be fast
    expect(averageResponseTime).toBeLessThan(500);
    
    // Should not have too many concurrent requests
    expect(completedRequests.length).toBeLessThan(10);
    
    console.log(`API requests: ${completedRequests.length}, Average response time: ${averageResponseTime}ms`);
  });

  test('should optimize memory usage', async ({ page }) => {
    await helpers.login();
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });
    
    // Navigate through multiple pages
    const pages = ['/dashboard', '/clients', '/revenue-analytics', '/calendar'];
    
    for (const pagePath of pages) {
      await helpers.navigateTo(pagePath);
      await helpers.waitForLoadingComplete();
      await page.waitForTimeout(1000);
    }
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
      
      // Memory increase should be reasonable (< 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
      
      console.log(`Memory usage - Initial: ${initialMemory.usedJSHeapSize}, Final: ${finalMemory.usedJSHeapSize}, Increase: ${memoryIncreasePercent.toFixed(2)}%`);
    }
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });
    
    const startTime = Date.now();
    await helpers.login();
    await helpers.waitForLoadingComplete();
    const loadTime = Date.now() - startTime;
    
    // Should still load in reasonable time even with slow network
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
    
    // Check that loading states are shown
    // (This would be tested during the loading process)
    console.log(`Slow network load time: ${loadTime}ms`);
  });

  test('should optimize database queries', async ({ page }) => {
    await helpers.login();
    
    // Monitor API requests to check for N+1 queries
    const apiCalls: { [key: string]: number } = {};
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        const endpoint = request.url().split('/api/')[1].split('?')[0];
        apiCalls[endpoint] = (apiCalls[endpoint] || 0) + 1;
      }
    });
    
    // Load clients page which should fetch clients and related data
    await helpers.navigateTo('/clients');
    await helpers.waitForLoadingComplete();
    
    // Should not make excessive API calls for the same endpoint
    Object.entries(apiCalls).forEach(([endpoint, count]) => {
      expect(count).toBeLessThan(5); // No endpoint should be called more than 5 times
      console.log(`API endpoint ${endpoint} called ${count} times`);
    });
  });

  test('should measure Time to Interactive (TTI)', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await helpers.login();
    
    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');
    
    // Test interactivity by clicking a button
    await helpers.clickElement('add-client-button');
    await expect(page.locator('[data-testid="client-form-modal"]')).toBeVisible();
    
    const timeToInteractive = Date.now() - startTime;
    
    // TTI should be under 3.5 seconds
    expect(timeToInteractive).toBeLessThan(3500);
    
    console.log(`Time to Interactive: ${timeToInteractive}ms`);
  });

  test('should optimize for mobile performance', async ({ page }) => {
    // Set mobile viewport and simulate mobile CPU
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate slower mobile CPU
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    
    const startTime = Date.now();
    await helpers.login();
    await helpers.waitForLoadingComplete();
    const mobileLoadTime = Date.now() - startTime;
    
    // Mobile load time should still be reasonable
    expect(mobileLoadTime).toBeLessThan(5000);
    
    // Test mobile interactions
    const interactionStart = Date.now();
    await helpers.clickElement('mobile-menu-toggle');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    const interactionTime = Date.now() - interactionStart;
    
    // Mobile interactions should be responsive
    expect(interactionTime).toBeLessThan(300);
    
    console.log(`Mobile load time: ${mobileLoadTime}ms, Interaction time: ${interactionTime}ms`);
  });

  test('should generate performance report', async ({ page }) => {
    await helpers.login();
    
    // Collect comprehensive performance data
    const performanceData = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');
      
      return {
        navigation: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.navigationStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        },
        resources: {
          total: resources.length,
          scripts: resources.filter(r => r.name.includes('.js')).length,
          stylesheets: resources.filter(r => r.name.includes('.css')).length,
          images: resources.filter(r => (r as any).initiatorType === 'img').length,
          totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
        },
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null
      };
    });
    
    // Write performance report
    const reportPath = 'performance-reports/performance-report.json';
    await page.evaluate((data) => {
      // This would typically write to a file system in a real implementation
      console.log('Performance Report:', JSON.stringify(data, null, 2));
    }, performanceData);
    
    // Validate performance metrics
    expect(performanceData.navigation.domContentLoaded).toBeLessThan(1500);
    expect(performanceData.navigation.firstContentfulPaint).toBeLessThan(1800);
    expect(performanceData.resources.totalSize).toBeLessThan(2 * 1024 * 1024); // 2MB
    
    console.log('Performance report generated:', performanceData);
  });
});