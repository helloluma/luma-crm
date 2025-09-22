import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers } from './fixtures/test-data';

test.describe('Cross-browser compatibility', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should load and display login page correctly', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check essential elements are present
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    
    // Take screenshot for visual comparison
    await helpers.takeScreenshot('login-page-cross-browser');
  });

  test('should handle authentication flow', async ({ page }) => {
    await helpers.login(testUsers.agent.email, testUsers.agent.password);
    
    // Should successfully reach dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    
    // Take screenshot of dashboard
    await helpers.takeScreenshot('dashboard-cross-browser');
  });

  test('should display responsive layout', async ({ page }) => {
    await helpers.login();
    
    // Check layout components
    const viewport = page.viewportSize();
    
    if (viewport && viewport.width < 768) {
      // Mobile-specific checks
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    } else {
      // Desktop-specific checks
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      await expect(page.locator('[data-testid="top-nav"]')).toBeVisible();
    }
    
    // Common elements that should be visible on all devices
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    
    // Take screenshot for layout comparison
    await helpers.takeScreenshot('layout-cross-browser');
  });

  test('should handle form interactions', async ({ page }) => {
    await helpers.login();
    await helpers.navigateTo('/clients');
    
    // Test form interaction
    await helpers.clickElement('add-client-button');
    await expect(page.locator('[data-testid="client-form-modal"]')).toBeVisible();
    
    // Fill form fields
    await helpers.fillField('client-name-input', 'Test Client');
    await helpers.fillField('client-email-input', 'test@example.com');
    
    // Check form validation works
    await helpers.clickElement('save-client-button');
    
    // Should show success or validation errors
    const hasSuccess = await helpers.isElementVisible('success-message');
    const hasError = await helpers.isElementVisible('validation-error');
    
    expect(hasSuccess || hasError).toBeTruthy();
    
    // Take screenshot of form interaction
    await helpers.takeScreenshot('form-interaction-cross-browser');
  });

  test('should handle JavaScript functionality', async ({ page }) => {
    await helpers.login();
    await helpers.navigateTo('/revenue-analytics');
    
    // Test interactive chart functionality
    await helpers.waitForLoadingComplete();
    
    // Check chart is rendered (Canvas element should be present)
    await expect(page.locator('canvas')).toBeVisible();
    
    // Test dropdown interactions
    const periodSelector = page.locator('[data-testid="chart-period-selector"]');
    if (await periodSelector.isVisible()) {
      await periodSelector.selectOption('yearly');
      await helpers.waitForLoadingComplete();
      
      // Chart should still be visible after period change
      await expect(page.locator('canvas')).toBeVisible();
    }
    
    // Take screenshot of interactive elements
    await helpers.takeScreenshot('javascript-functionality-cross-browser');
  });

  test('should maintain accessibility standards', async ({ page }) => {
    await helpers.login();
    
    // Basic accessibility checks
    await helpers.checkAccessibility();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
    
    // Check color contrast (basic check)
    const button = page.locator('[data-testid="add-client-button"]').first();
    if (await button.isVisible()) {
      const styles = await button.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Ensure colors are not the same (basic contrast check)
      expect(styles.color).not.toBe(styles.backgroundColor);
    }
  });
});

// Cross-browser visual comparison test
test.describe('Cross-browser visual comparison', () => {
  test('should render consistently across browsers', async ({ page, browserName }) => {
    const helpers = new TestHelpers(page);
    await helpers.login();
    
    // Take screenshots of key pages for visual comparison
    const pages = [
      { path: '/dashboard', name: 'dashboard' },
      { path: '/clients', name: 'clients' },
      { path: '/revenue-analytics', name: 'revenue' },
      { path: '/calendar', name: 'calendar' }
    ];
    
    for (const testPage of pages) {
      await helpers.navigateTo(testPage.path);
      await helpers.waitForLoadingComplete();
      
      // Take full page screenshot
      await page.screenshot({
        path: `test-results/visual-comparison/${testPage.name}-${browserName}.png`,
        fullPage: true
      });
    }
  });
});