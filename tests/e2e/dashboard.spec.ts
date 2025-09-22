import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers, mockApiResponses } from './fixtures/test-data';

test.describe('Dashboard Functionality', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Mock API responses for consistent testing
    await helpers.mockApiResponse('**/api/dashboard/metrics', mockApiResponses.dashboardMetrics);
    await helpers.mockApiResponse('**/api/activities', mockApiResponses.activityFeed);
    await helpers.mockApiResponse('**/api/dashboard/revenue', mockApiResponses.revenueAnalytics);
    
    await helpers.login();
  });

  test('should display dashboard with all key components', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
  });

  test('should display correct metrics data', async ({ page }) => {
    await helpers.waitForLoadingComplete();
    
    // Check metrics cards display correct data
    await expect(page.locator('[data-testid="active-clients-metric"]')).toContainText('15');
    await expect(page.locator('[data-testid="pending-deals-metric"]')).toContainText('8');
    await expect(page.locator('[data-testid="monthly-revenue-metric"]')).toContainText('$45,000');
    await expect(page.locator('[data-testid="total-commissions-metric"]')).toContainText('$135,000');
  });

  test('should render performance chart correctly', async ({ page }) => {
    await helpers.waitForLoadingComplete();
    
    // Check chart container is present
    await expect(page.locator('[data-testid="performance-chart-container"]')).toBeVisible();
    
    // Check chart canvas is rendered
    await expect(page.locator('canvas')).toBeVisible();
    
    // Check chart legend
    await expect(page.locator('[data-testid="chart-legend"]')).toBeVisible();
  });

  test('should display activity feed with recent activities', async ({ page }) => {
    await helpers.waitForLoadingComplete();
    
    // Check activity feed items
    await expect(page.locator('[data-testid="activity-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="activity-item"]').first()).toContainText('New client John Doe added');
    
    // Check activity timestamps
    await expect(page.locator('[data-testid="activity-timestamp"]').first()).toBeVisible();
  });

  test('should provide functional quick actions', async ({ page }) => {
    await helpers.waitForLoadingComplete();
    
    // Test Add Client quick action
    await helpers.clickElement('quick-action-add-client');
    await expect(page.locator('[data-testid="client-form-modal"]')).toBeVisible();
    await helpers.clickElement('modal-close-button');
    
    // Test Add Transaction quick action
    await helpers.clickElement('quick-action-add-transaction');
    await expect(page.locator('[data-testid="transaction-form-modal"]')).toBeVisible();
    await helpers.clickElement('modal-close-button');
    
    // Test Schedule Appointment quick action
    await helpers.clickElement('quick-action-schedule-appointment');
    await expect(page.locator('[data-testid="appointment-form-modal"]')).toBeVisible();
    await helpers.clickElement('modal-close-button');
  });

  test('should update metrics in real-time', async ({ page }) => {
    await helpers.waitForLoadingComplete();
    
    // Mock updated metrics
    const updatedMetrics = {
      ...mockApiResponses.dashboardMetrics,
      activeClients: 16,
      monthlyRevenue: 47000
    };
    
    await helpers.mockApiResponse('**/api/dashboard/metrics', updatedMetrics);
    
    // Trigger refresh (simulate real-time update)
    await page.reload();
    await helpers.waitForLoadingComplete();
    
    // Check updated values
    await expect(page.locator('[data-testid="active-clients-metric"]')).toContainText('16');
    await expect(page.locator('[data-testid="monthly-revenue-metric"]')).toContainText('$47,000');
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    await helpers.checkResponsiveDesign('dashboard-container');
    
    // Test mobile layout specifically
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Check mobile-specific elements
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
    
    // Check that charts are still functional on mobile
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should handle loading states gracefully', async ({ page }) => {
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
    
    // Check loading states are shown
    await expect(page.locator('[data-testid="metrics-loading"]')).toBeVisible();
    
    // Wait for loading to complete
    await helpers.waitForLoadingComplete();
    
    // Check content is displayed
    await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/dashboard/metrics', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.reload();
    
    // Check error state is displayed
    await expect(page.locator('[data-testid="metrics-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Test retry functionality
    await helpers.mockApiResponse('**/api/dashboard/metrics', mockApiResponses.dashboardMetrics);
    await helpers.clickElement('retry-button');
    
    await helpers.waitForLoadingComplete();
    await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await helpers.testKeyboardNavigation();
    
    // Test specific dashboard keyboard shortcuts
    await page.keyboard.press('Alt+1'); // Should focus on first metric card
    await page.keyboard.press('Alt+2'); // Should focus on second metric card
    
    // Test quick action keyboard shortcuts
    await page.keyboard.press('Ctrl+n'); // Should open new client modal
    await expect(page.locator('[data-testid="client-form-modal"]')).toBeVisible();
  });

  test('should maintain state when navigating away and back', async ({ page }) => {
    await helpers.waitForLoadingComplete();
    
    // Navigate to clients page
    await helpers.navigateTo('/clients');
    await expect(page.locator('[data-testid="clients-title"]')).toBeVisible();
    
    // Navigate back to dashboard
    await helpers.navigateTo('/dashboard');
    
    // Check that dashboard state is maintained
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
  });
});