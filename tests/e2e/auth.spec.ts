import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers } from './fixtures/test-data';

test.describe('Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display login form correctly', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check form elements are present
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="forgot-password-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-link"]')).toBeVisible();

    // Check accessibility
    await helpers.checkAccessibility();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await helpers.login(testUsers.agent.email, testUsers.agent.password);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    
    // Should display user info in navigation
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testUsers.agent.name);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await helpers.fillField('email-input', 'invalid@example.com');
    await helpers.fillField('password-input', 'wrongpassword');
    await helpers.clickElement('login-button');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    
    // Should remain on login page
    await expect(page).toHaveURL('/auth/login');
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/auth/register');
    
    const newUser = {
      name: 'New Test User',
      email: 'newuser@test.com',
      password: 'newpassword123',
      role: 'Assistant'
    };
    
    await helpers.fillField('name-input', newUser.name);
    await helpers.fillField('email-input', newUser.email);
    await helpers.fillField('password-input', newUser.password);
    await helpers.fillField('confirm-password-input', newUser.password);
    await page.selectOption('[data-testid="role-select"]', newUser.role);
    
    await helpers.clickElement('register-button');
    
    // Should redirect to dashboard or email confirmation
    await page.waitForURL(/\/(dashboard|auth\/confirm)/);
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    await helpers.fillField('email-input', testUsers.agent.email);
    await helpers.clickElement('reset-password-button');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('reset link sent');
  });

  test('should logout successfully', async ({ page }) => {
    await helpers.login();
    
    // Click user menu
    await helpers.clickElement('user-menu-button');
    await expect(page.locator('[data-testid="user-dropdown"]')).toBeVisible();
    
    // Click logout
    await helpers.clickElement('logout-button');
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
  });

  test('should handle OAuth authentication', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Mock OAuth response
    await page.route('**/auth/callback**', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard'
        }
      });
    });
    
    await helpers.clickElement('google-oauth-button');
    
    // Should handle OAuth flow (mocked)
    // In real implementation, this would test the actual OAuth flow
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/login');
    
    // Check mobile layout
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await helpers.checkResponsiveDesign('login-form');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
    
    // Test form submission with Enter
    await helpers.fillField('email-input', testUsers.agent.email);
    await helpers.fillField('password-input', testUsers.agent.password);
    await page.keyboard.press('Enter');
    
    await page.waitForURL('/dashboard');
  });
});