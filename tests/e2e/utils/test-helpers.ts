import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Login with test credentials
   */
  async login(email: string = 'test@example.com', password: string = 'password123') {
    await this.page.goto('/auth/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard');
    await expect(this.page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  }

  /**
   * Logout user
   */
  async logout() {
    await this.page.click('[data-testid="user-menu-button"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/auth/login');
  }

  /**
   * Navigate to a specific page and wait for it to load
   */
  async navigateTo(path: string, waitForSelector?: string) {
    await this.page.goto(path);
    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector);
    }
  }

  /**
   * Fill form field by test id
   */
  async fillField(testId: string, value: string) {
    await this.page.fill(`[data-testid="${testId}"]`, value);
  }

  /**
   * Click element by test id
   */
  async clickElement(testId: string) {
    await this.page.click(`[data-testid="${testId}"]`);
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(testId: string) {
    await this.page.waitForSelector(`[data-testid="${testId}"]`, { state: 'visible' });
  }

  /**
   * Check if element exists and is visible
   */
  async isElementVisible(testId: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`[data-testid="${testId}"]`, { 
        state: 'visible', 
        timeout: 5000 
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Take screenshot with custom name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp) {
    return await this.page.waitForResponse(urlPattern);
  }

  /**
   * Mock API response
   */
  async mockApiResponse(urlPattern: string | RegExp, response: any) {
    await this.page.route(urlPattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Check responsive design at different viewport sizes
   */
  async checkResponsiveDesign(testId: string) {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500); // Allow for responsive adjustments
      
      const element = this.page.locator(`[data-testid="${testId}"]`);
      await expect(element).toBeVisible();
      
      // Take screenshot for visual comparison
      await this.takeScreenshot(`${testId}-${viewport.name}`);
    }
  }

  /**
   * Test accessibility
   */
  async checkAccessibility() {
    // Check for basic accessibility attributes
    const buttons = this.page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasText = await button.textContent();
      
      expect(hasAriaLabel || hasText).toBeTruthy();
    }

    // Check for form labels
    const inputs = this.page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.getAttribute('aria-label') || 
                      await this.page.locator(`label[for="${await input.getAttribute('id')}"]`).count() > 0;
      
      expect(hasLabel).toBeTruthy();
    }
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    // Test Tab navigation
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();

    // Test Enter key on buttons
    const buttons = this.page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      await buttons.first().focus();
      await this.page.keyboard.press('Enter');
    }
  }

  /**
   * Wait for loading states to complete
   */
  async waitForLoadingComplete() {
    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('[data-testid*="loading"]', { state: 'hidden', timeout: 10000 });
    
    // Wait for network idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create test client data
   */
  async createTestClient(clientData: {
    name: string;
    email: string;
    phone?: string;
    type?: string;
  }) {
    await this.navigateTo('/clients');
    await this.clickElement('add-client-button');
    
    await this.fillField('client-name-input', clientData.name);
    await this.fillField('client-email-input', clientData.email);
    
    if (clientData.phone) {
      await this.fillField('client-phone-input', clientData.phone);
    }
    
    if (clientData.type) {
      await this.page.selectOption('[data-testid="client-type-select"]', clientData.type);
    }
    
    await this.clickElement('save-client-button');
    await this.waitForLoadingComplete();
  }

  /**
   * Create test transaction data
   */
  async createTestTransaction(transactionData: {
    address: string;
    price: number;
    commissionRate: number;
    clientId?: string;
  }) {
    await this.navigateTo('/revenue-analytics');
    await this.clickElement('add-transaction-button');
    
    await this.fillField('transaction-address-input', transactionData.address);
    await this.fillField('transaction-price-input', transactionData.price.toString());
    await this.fillField('transaction-commission-rate-input', transactionData.commissionRate.toString());
    
    if (transactionData.clientId) {
      await this.page.selectOption('[data-testid="transaction-client-select"]', transactionData.clientId);
    }
    
    await this.clickElement('save-transaction-button');
    await this.waitForLoadingComplete();
  }
}