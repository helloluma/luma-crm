import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers, mockApiResponses } from './fixtures/test-data';

test.describe('Visual Regression Testing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Mock API responses for consistent visual testing
    await helpers.mockApiResponse('**/api/dashboard/metrics', mockApiResponses.dashboardMetrics);
    await helpers.mockApiResponse('**/api/activities', mockApiResponses.activityFeed);
    await helpers.mockApiResponse('**/api/dashboard/revenue', mockApiResponses.revenueAnalytics);
  });

  test('should match login page visual baseline', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic elements that might cause flakiness
    await page.addStyleTag({
      content: `
        [data-testid="loading-spinner"] { display: none !important; }
        .animate-pulse { animation: none !important; }
      `
    });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take screenshot of specific components
    await expect(page.locator('[data-testid="login-form"]')).toHaveScreenshot('login-form.png');
  });

  test('should match dashboard visual baseline', async ({ page }) => {
    await helpers.login();
    await helpers.waitForLoadingComplete();
    
    // Hide dynamic timestamps and loading states
    await page.addStyleTag({
      content: `
        [data-testid="activity-timestamp"] { visibility: hidden !important; }
        [data-testid="loading-spinner"] { display: none !important; }
        .animate-pulse { animation: none !important; }
        [data-testid="current-time"] { visibility: hidden !important; }
      `
    });
    
    // Take full dashboard screenshot
    await expect(page).toHaveScreenshot('dashboard-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take screenshots of individual components
    await expect(page.locator('[data-testid="metrics-cards"]')).toHaveScreenshot('metrics-cards.png');
    await expect(page.locator('[data-testid="performance-chart-container"]')).toHaveScreenshot('performance-chart.png');
    await expect(page.locator('[data-testid="activity-feed"]')).toHaveScreenshot('activity-feed.png');
  });

  test('should match clients page visual baseline', async ({ page }) => {
    await helpers.login();
    await helpers.navigateTo('/clients');
    await helpers.waitForLoadingComplete();
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        [data-testid="last-contact-time"] { visibility: hidden !important; }
        [data-testid="loading-spinner"] { display: none !important; }
        .animate-pulse { animation: none !important; }
      `
    });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('clients-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take screenshots of components
    await expect(page.locator('[data-testid="clients-header"]')).toHaveScreenshot('clients-header.png');
    await expect(page.locator('[data-testid="clients-grid"]')).toHaveScreenshot('clients-grid.png');
  });

  test('should match revenue analytics visual baseline', async ({ page }) => {
    await helpers.login();
    await helpers.navigateTo('/revenue-analytics');
    await helpers.waitForLoadingComplete();
    
    // Wait for charts to render
    await page.waitForSelector('canvas', { state: 'visible' });
    await page.waitForTimeout(1000); // Allow chart animations to complete
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        [data-testid="last-updated-time"] { visibility: hidden !important; }
        [data-testid="loading-spinner"] { display: none !important; }
        .animate-pulse { animation: none !important; }
        canvas { animation: none !important; }
      `
    });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('revenue-analytics-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take screenshots of components
    await expect(page.locator('[data-testid="revenue-metrics-cards"]')).toHaveScreenshot('revenue-metrics.png');
    await expect(page.locator('[data-testid="revenue-chart-container"]')).toHaveScreenshot('revenue-chart.png');
    await expect(page.locator('[data-testid="transaction-table"]')).toHaveScreenshot('transaction-table.png');
  });

  test('should match calendar page visual baseline', async ({ page }) => {
    await helpers.login();
    await helpers.navigateTo('/calendar');
    await helpers.waitForLoadingComplete();
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        [data-testid="current-time-indicator"] { display: none !important; }
        [data-testid="loading-spinner"] { display: none !important; }
        .animate-pulse { animation: none !important; }
      `
    });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('calendar-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take screenshots of components
    await expect(page.locator('[data-testid="calendar-header"]')).toHaveScreenshot('calendar-header.png');
    await expect(page.locator('[data-testid="calendar-grid"]')).toHaveScreenshot('calendar-grid.png');
  });

  test('should match modal dialogs visual baseline', async ({ page }) => {
    await helpers.login();
    await helpers.navigateTo('/clients');
    
    // Open client form modal
    await helpers.clickElement('add-client-button');
    await expect(page.locator('[data-testid="client-form-modal"]')).toBeVisible();
    
    // Take modal screenshot
    await expect(page.locator('[data-testid="client-form-modal"]')).toHaveScreenshot('client-form-modal.png');
    
    // Close modal and test appointment modal
    await helpers.clickElement('modal-close-button');
    await helpers.navigateTo('/calendar');
    
    await helpers.clickElement('add-appointment-button');
    await expect(page.locator('[data-testid="appointment-form-modal"]')).toBeVisible();
    
    await expect(page.locator('[data-testid="appointment-form-modal"]')).toHaveScreenshot('appointment-form-modal.png');
  });

  test('should match error states visual baseline', async ({ page }) => {
    await helpers.login();
    
    // Mock API error
    await page.route('**/api/dashboard/metrics', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.reload();
    await page.waitForSelector('[data-testid="metrics-error"]', { state: 'visible' });
    
    // Take screenshot of error state
    await expect(page.locator('[data-testid="metrics-error"]')).toHaveScreenshot('metrics-error-state.png');
  });

  test('should match loading states visual baseline', async ({ page }) => {
    await helpers.login();
    
    // Mock slow API response
    await page.route('**/api/dashboard/metrics', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockApiResponses.dashboardMetrics)
      });
    });
    
    await page.reload();
    
    // Capture loading state
    await expect(page.locator('[data-testid="metrics-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-loading"]')).toHaveScreenshot('metrics-loading-state.png');
  });

  test('should match mobile visual baseline', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await helpers.login();
    await helpers.waitForLoadingComplete();
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        [data-testid="activity-timestamp"] { visibility: hidden !important; }
        [data-testid="loading-spinner"] { display: none !important; }
        .animate-pulse { animation: none !important; }
      `
    });
    
    // Take mobile dashboard screenshot
    await expect(page).toHaveScreenshot('mobile-dashboard.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Test mobile navigation
    await helpers.clickElement('mobile-menu-toggle');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu"]')).toHaveScreenshot('mobile-menu.png');
  });

  test('should match tablet visual baseline', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await helpers.login();
    await helpers.waitForLoadingComplete();
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        [data-testid="activity-timestamp"] { visibility: hidden !important; }
        [data-testid="loading-spinner"] { display: none !important; }
        .animate-pulse { animation: none !important; }
      `
    });
    
    // Take tablet dashboard screenshot
    await expect(page).toHaveScreenshot('tablet-dashboard.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match dark mode visual baseline', async ({ page }) => {
    // Enable dark mode (if implemented)
    await page.addStyleTag({
      content: `
        :root { color-scheme: dark; }
        body { background-color: #1a1a1a; color: #ffffff; }
      `
    });
    
    await helpers.login();
    await helpers.waitForLoadingComplete();
    
    // Take dark mode screenshot
    await expect(page).toHaveScreenshot('dark-mode-dashboard.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match high contrast visual baseline', async ({ page }) => {
    // Enable high contrast mode
    await page.addStyleTag({
      content: `
        * {
          filter: contrast(150%) !important;
        }
        body {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
      `
    });
    
    await helpers.login();
    await helpers.waitForLoadingComplete();
    
    // Take high contrast screenshot
    await expect(page).toHaveScreenshot('high-contrast-dashboard.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should match print styles visual baseline', async ({ page }) => {
    await helpers.login();
    await helpers.navigateTo('/revenue-analytics');
    await helpers.waitForLoadingComplete();
    
    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    
    // Take print view screenshot
    await expect(page).toHaveScreenshot('print-revenue-analytics.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('should detect visual regressions in form validation', async ({ page }) => {
    await helpers.login();
    await helpers.navigateTo('/clients');
    
    // Open form and trigger validation errors
    await helpers.clickElement('add-client-button');
    await helpers.clickElement('save-client-button');
    
    // Wait for validation errors to appear
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    
    // Take screenshot of validation state
    await expect(page.locator('[data-testid="client-form-modal"]')).toHaveScreenshot('form-validation-errors.png');
  });

  test('should match component hover states', async ({ page }) => {
    await helpers.login();
    await helpers.navigateTo('/clients');
    await helpers.waitForLoadingComplete();
    
    // Hover over client card
    const clientCard = page.locator('[data-testid="client-card"]').first();
    if (await clientCard.isVisible()) {
      await clientCard.hover();
      await expect(clientCard).toHaveScreenshot('client-card-hover.png');
    }
    
    // Hover over button
    const addButton = page.locator('[data-testid="add-client-button"]');
    await addButton.hover();
    await expect(addButton).toHaveScreenshot('add-button-hover.png');
  });

  test('should match focus states for accessibility', async ({ page }) => {
    await helpers.login();
    
    // Focus on various interactive elements
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveScreenshot('focused-element.png');
    
    // Focus on form inputs
    await helpers.navigateTo('/clients');
    await helpers.clickElement('add-client-button');
    
    const nameInput = page.locator('[data-testid="client-name-input"]');
    await nameInput.focus();
    await expect(nameInput).toHaveScreenshot('focused-input.png');
  });
});