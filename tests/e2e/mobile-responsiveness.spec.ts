import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers } from './fixtures/test-data';

// Custom viewport sizes for comprehensive testing
const customViewports = [
  { name: 'Small Mobile', width: 320, height: 568 },
  { name: 'Large Mobile', width: 414, height: 896 },
  { name: 'Small Tablet', width: 768, height: 1024 },
  { name: 'Large Tablet', width: 1024, height: 1366 },
  { name: 'Desktop Small', width: 1280, height: 720 },
  { name: 'Desktop Large', width: 1920, height: 1080 }
];

test.describe('Mobile Responsiveness Testing', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display mobile-optimized login on iPhone 12', async ({ page }) => {
    // Set iPhone 12 viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/auth/login');
    
    // Check mobile-specific elements
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Verify form is properly sized for mobile
    const loginForm = page.locator('[data-testid="login-form"]');
    const boundingBox = await loginForm.boundingBox();
    
    expect(boundingBox?.width).toBeLessThanOrEqual(390);
    
    // Check touch-friendly button sizes
    const loginButton = page.locator('[data-testid="login-button"]');
    const buttonBox = await loginButton.boundingBox();
    
    // Buttons should be at least 44px high for touch accessibility
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    
    // Take screenshot for visual verification
    await helpers.takeScreenshot('mobile-login-iphone12');
  });

  test('should provide mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.login();
    
    // Check mobile navigation elements
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    
    // Desktop sidebar should be hidden on mobile
    const sidebar = page.locator('[data-testid="sidebar"]');
    const isDesktopSidebarVisible = await sidebar.isVisible();
    expect(isDesktopSidebarVisible).toBeFalsy();
    
    // Test mobile menu functionality
    await helpers.clickElement('mobile-menu-toggle');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test navigation links in mobile menu
    await helpers.clickElement('mobile-nav-clients');
    await expect(page).toHaveURL('/clients');
    
    // Take screenshot of mobile navigation
    await helpers.takeScreenshot('mobile-navigation');
  });

  test('should display mobile-optimized dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.login();
    
    // Check mobile dashboard layout
    await expect(page.locator('[data-testid="mobile-dashboard-layout"]')).toBeVisible();
    
    // Metrics cards should stack vertically on mobile
    const metricsCards = page.locator('[data-testid="metrics-card"]');
    const cardCount = await metricsCards.count();
    
    if (cardCount > 1) {
      const firstCard = await metricsCards.first().boundingBox();
      const secondCard = await metricsCards.nth(1).boundingBox();
      
      // Cards should be stacked (second card below first)
      if (firstCard && secondCard) {
        expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height - 10);
      }
    }
    
    // Chart should be responsive
    const chartContainer = page.locator('[data-testid="performance-chart-container"]');
    if (await chartContainer.isVisible()) {
      const chartBox = await chartContainer.boundingBox();
      expect(chartBox?.width).toBeLessThanOrEqual(375 - 40); // Account for padding
    }
    
    // Take screenshot of mobile dashboard
    await helpers.takeScreenshot('mobile-dashboard');
  });

  test('should handle mobile form interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.login();
    await helpers.navigateTo('/clients');
    
    // Test mobile form modal
    await helpers.clickElement('mobile-add-client-fab');
    await expect(page.locator('[data-testid="client-form-modal"]')).toBeVisible();
    
    // Form should be full-screen or properly sized for mobile
    const formModal = page.locator('[data-testid="client-form-modal"]');
    const modalBox = await formModal.boundingBox();
    
    expect(modalBox?.width).toBeGreaterThan(375 * 0.8);
    
    // Test form field interactions
    await helpers.fillField('client-name-input', 'Mobile Test Client');
    await helpers.fillField('client-email-input', 'mobile@test.com');
    
    // Check virtual keyboard doesn't break layout
    const nameInput = page.locator('[data-testid="client-name-input"]');
    await nameInput.focus();
    
    // Input should still be visible after focus
    await expect(nameInput).toBeVisible();
    
    // Take screenshot of mobile form
    await helpers.takeScreenshot('mobile-form');
  });

  test('should provide touch-friendly interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.login();
    await helpers.navigateTo('/calendar');
    
    // Test touch interactions on calendar
    const calendarGrid = page.locator('[data-testid="calendar-grid"]');
    await expect(calendarGrid).toBeVisible();
    
    // Test tap on calendar date
    const dateCell = page.locator('[data-testid="calendar-date-cell"]').first();
    if (await dateCell.isVisible()) {
      await dateCell.tap();
      
      // Should show date selection or appointment creation
      const hasDateSelection = await helpers.isElementVisible('date-selected') ||
                              await helpers.isElementVisible('appointment-form-modal');
      expect(hasDateSelection).toBeTruthy();
    }
    
    // Test mobile-specific UI elements
    await expect(page.locator('[data-testid="mobile-add-appointment-fab"]')).toBeVisible();
    
    // Take screenshot of touch interactions
    await helpers.takeScreenshot('mobile-touch');
  });

  test('should handle mobile table layouts', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.login();
    await helpers.navigateTo('/revenue-analytics');
    
    // Check mobile table handling
    const transactionTable = page.locator('[data-testid="transaction-table"]');
    if (await transactionTable.isVisible()) {
      // Table should be horizontally scrollable on mobile
      const hasHorizontalScroll = await page.evaluate(() => {
        const table = document.querySelector('[data-testid="transaction-table"]');
        return table ? table.scrollWidth > table.clientWidth : false;
      });
      
      const hasCardLayout = await helpers.isElementVisible('mobile-transaction-cards');
      
      expect(hasHorizontalScroll || hasCardLayout).toBeTruthy();
    }
    
    // Take screenshot of mobile table layout
    await helpers.takeScreenshot('mobile-table');
  });

  // Test custom viewport sizes
  customViewports.forEach(({ name, width, height }) => {
    test(`should adapt layout for ${name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await helpers.login();
      
      // Check layout adaptation
      const sidebar = page.locator('[data-testid="sidebar"]');
      const mobileMenu = page.locator('[data-testid="mobile-menu-toggle"]');
      
      if (width < 768) {
        // Mobile layout
        expect(await mobileMenu.isVisible()).toBeTruthy();
        expect(await sidebar.isVisible()).toBeFalsy();
      } else if (width < 1024) {
        // Tablet layout
        const sidebarVisible = await sidebar.isVisible();
        const mobileMenuVisible = await mobileMenu.isVisible();
        
        // Either mobile menu or sidebar should be visible
        expect(sidebarVisible || mobileMenuVisible).toBeTruthy();
      } else {
        // Desktop layout
        expect(await sidebar.isVisible()).toBeTruthy();
      }
      
      // Take screenshot for layout verification
      await helpers.takeScreenshot(`viewport-${name.replace(/\s+/g, '-')}`);
    });

    test(`should handle content overflow for ${name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await helpers.login();
      await helpers.navigateTo('/clients');
      
      // Check content doesn't overflow viewport
      const mainContent = page.locator('[data-testid="main-content"]');
      const contentBox = await mainContent.boundingBox();
      
      if (contentBox) {
        expect(contentBox.width).toBeLessThanOrEqual(width);
        
        // Check for horizontal scrollbars (should be minimal)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        // Horizontal scroll should be minimal or intentional
        if (hasHorizontalScroll) {
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
          
          // Allow small overflow (less than 20px)
          expect(scrollWidth - clientWidth).toBeLessThan(20);
        }
      }
    });
  });

  test('should handle breakpoint transitions smoothly', async ({ page }) => {
    await helpers.login();
    
    const breakpoints = [
      { width: 1200, height: 800, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.waitForTimeout(500); // Allow for responsive adjustments
      
      // Check layout is stable
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Take screenshot at each breakpoint
      await helpers.takeScreenshot(`breakpoint-${breakpoint.name}`);
    }
  });

  test('should maintain functionality across all breakpoints', async ({ page }) => {
    await helpers.login();
    
    const testBreakpoints = [
      { width: 1920, height: 1080 },
      { width: 1024, height: 768 },
      { width: 375, height: 667 }
    ];
    
    for (const viewport of testBreakpoints) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);
      
      // Test navigation functionality
      await helpers.navigateTo('/clients');
      await expect(page.locator('[data-testid="clients-title"]')).toBeVisible();
      
      // Test form functionality
      const addButton = page.locator('[data-testid="add-client-button"], [data-testid="mobile-add-client-fab"]');
      await addButton.first().click();
      await expect(page.locator('[data-testid="client-form-modal"]')).toBeVisible();
      
      // Close modal
      const closeButton = page.locator('[data-testid="modal-close-button"], [data-testid="close-modal"]');
      await closeButton.first().click();
      
      // Test search functionality
      const searchInput = page.locator('[data-testid="client-search-input"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.keyboard.press('Enter');
        await helpers.waitForLoadingComplete();
      }
    }
  });
});