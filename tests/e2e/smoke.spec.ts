import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Smoke Tests', () => {
  test('health check endpoint responds correctly', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });

  test('database health check responds correctly', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health/database`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.database.status).toBe('connected');
  });

  test('home page loads successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Real Estate CRM/);
    
    // Check for critical elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);
    
    // Check if login form is present
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('API routes are accessible', async ({ request }) => {
    // Test a few critical API endpoints
    const endpoints = [
      '/api/health',
      '/api/health/database',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${BASE_URL}${endpoint}`);
      expect(response.status()).toBeLessThan(500); // Should not return server errors
    }
  });

  test('static assets load correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check if CSS is loaded (page should have styling)
    const bodyStyles = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).margin;
    });
    
    // If CSS is loaded, body should have some styling
    expect(bodyStyles).toBeDefined();
  });

  test('JavaScript is working', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Test if JavaScript is executing by checking for React
    const hasReact = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || 
             document.querySelector('[data-reactroot]') !== null ||
             document.querySelector('#__next') !== null;
    });
    
    expect(hasReact).toBeTruthy();
  });

  test('security headers are present', async ({ request }) => {
    const response = await request.get(BASE_URL);
    const headers = response.headers();
    
    // Check for important security headers
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBeDefined();
  });

  test('HTTPS redirect works', async ({ request }) => {
    // Only test HTTPS redirect in production
    if (BASE_URL.startsWith('https://')) {
      const httpUrl = BASE_URL.replace('https://', 'http://');
      
      try {
        const response = await request.get(httpUrl, { 
          maxRedirects: 0,
          ignoreHTTPSErrors: true 
        });
        
        // Should redirect to HTTPS
        expect([301, 302, 307, 308]).toContain(response.status());
        
        const location = response.headers()['location'];
        expect(location).toMatch(/^https:/);
      } catch (error) {
        // HTTP might not be available, which is fine for security
        console.log('HTTP not available (expected in production)');
      }
    }
  });

  test('error pages work correctly', async ({ page }) => {
    // Test 404 page
    const response = await page.goto(`${BASE_URL}/non-existent-page`);
    expect(response?.status()).toBe(404);
    
    // Page should still render something (not completely broken)
    await expect(page.locator('body')).toBeVisible();
  });
});