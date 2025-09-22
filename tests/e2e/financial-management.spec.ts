import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers, testTransactions, mockApiResponses } from './fixtures/test-data';

test.describe('Financial Management System', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Mock revenue analytics API
    await helpers.mockApiResponse('**/api/dashboard/revenue', mockApiResponses.revenueAnalytics);
    await helpers.mockApiResponse('**/api/transactions', [testTransactions.active, testTransactions.pending]);
    
    await helpers.login();
  });

  test('should display revenue analytics dashboard', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    
    // Check main components
    await expect(page.locator('[data-testid="revenue-analytics-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-metrics-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="goal-tracker"]')).toBeVisible();
  });

  test('should display correct revenue metrics', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    await helpers.waitForLoadingComplete();
    
    // Check revenue metrics display
    await expect(page.locator('[data-testid="total-revenue-metric"]')).toContainText('$160,000');
    await expect(page.locator('[data-testid="yearly-goal-metric"]')).toContainText('$500,000');
    await expect(page.locator('[data-testid="goal-progress-bar"]')).toBeVisible();
    
    // Check progress percentage
    const progressText = await page.locator('[data-testid="goal-progress-text"]').textContent();
    expect(progressText).toContain('32%'); // 160k / 500k = 32%
  });

  test('should render revenue chart correctly', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    await helpers.waitForLoadingComplete();
    
    // Check chart is rendered
    await expect(page.locator('[data-testid="revenue-chart"] canvas')).toBeVisible();
    
    // Check chart controls
    await expect(page.locator('[data-testid="chart-period-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-type-selector"]')).toBeVisible();
    
    // Test chart period change
    await page.selectOption('[data-testid="chart-period-selector"]', 'yearly');
    await helpers.waitForLoadingComplete();
    
    // Chart should update (canvas should still be visible)
    await expect(page.locator('[data-testid="revenue-chart"] canvas')).toBeVisible();
  });

  test('should create new transaction successfully', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    
    // Open add transaction form
    await helpers.clickElement('add-transaction-button');
    await expect(page.locator('[data-testid="transaction-form-modal"]')).toBeVisible();
    
    // Fill transaction form
    const newTransaction = testTransactions.active;
    await helpers.fillField('transaction-address-input', newTransaction.address);
    await helpers.fillField('transaction-price-input', newTransaction.price.toString());
    await helpers.fillField('transaction-commission-rate-input', newTransaction.commissionRate.toString());
    await page.selectOption('[data-testid="transaction-status-select"]', newTransaction.status);
    await helpers.fillField('transaction-closing-date-input', newTransaction.closingDate);
    
    // Submit form
    await helpers.clickElement('save-transaction-button');
    await helpers.waitForLoadingComplete();
    
    // Verify transaction was created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-row"]').filter({ hasText: newTransaction.address })).toBeVisible();
  });

  test('should calculate commissions correctly', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    await helpers.clickElement('add-transaction-button');
    
    // Fill transaction details
    await helpers.fillField('transaction-price-input', '400000');
    await helpers.fillField('transaction-commission-rate-input', '3.0');
    
    // Check commission calculation
    await expect(page.locator('[data-testid="gross-commission-display"]')).toContainText('$12,000');
    
    // Add broker split
    await helpers.fillField('broker-split-input', '50');
    await expect(page.locator('[data-testid="net-commission-display"]')).toContainText('$6,000');
  });

  test('should filter and sort transactions', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    await helpers.waitForLoadingComplete();
    
    // Test status filter
    await page.selectOption('[data-testid="transaction-status-filter"]', 'Active');
    await helpers.waitForLoadingComplete();
    
    // Check filtered results
    const statusCells = page.locator('[data-testid="transaction-status-cell"]');
    const count = await statusCells.count();
    
    for (let i = 0; i < count; i++) {
      await expect(statusCells.nth(i)).toContainText('Active');
    }
    
    // Test sorting by price
    await helpers.clickElement('price-column-header');
    await helpers.waitForLoadingComplete();
    
    // Check sort order (prices should be in ascending order)
    const priceCells = page.locator('[data-testid="transaction-price-cell"]');
    const firstPrice = await priceCells.first().textContent();
    const lastPrice = await priceCells.last().textContent();
    
    // Extract numeric values and compare
    const firstValue = parseInt(firstPrice?.replace(/[^0-9]/g, '') || '0');
    const lastValue = parseInt(lastPrice?.replace(/[^0-9]/g, '') || '0');
    expect(firstValue).toBeLessThanOrEqual(lastValue);
  });

  test('should export transaction data', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    await helpers.waitForLoadingComplete();
    
    // Test CSV export
    const downloadPromise = page.waitForEvent('download');
    await helpers.clickElement('export-csv-button');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('transactions');
    expect(download.suggestedFilename()).toContain('.csv');
    
    // Test PDF export
    const pdfDownloadPromise = page.waitForEvent('download');
    await helpers.clickElement('export-pdf-button');
    
    const pdfDownload = await pdfDownloadPromise;
    expect(pdfDownload.suggestedFilename()).toContain('revenue-report');
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
  });

  test('should import CSV data successfully', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    
    // Open import modal
    await helpers.clickElement('import-csv-button');
    await expect(page.locator('[data-testid="csv-import-modal"]')).toBeVisible();
    
    // Mock CSV file upload
    const csvContent = `Address,Price,Commission Rate,Status,Closing Date
"123 Test St",350000,2.5,Active,2024-06-01
"456 Demo Ave",425000,3.0,Pending,2024-07-15`;
    
    const fileInput = page.locator('[data-testid="csv-file-input"]');
    await fileInput.setInputFiles({
      name: 'transactions.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    
    // Preview import data
    await helpers.clickElement('preview-import-button');
    await expect(page.locator('[data-testid="import-preview-table"]')).toBeVisible();
    
    // Confirm import
    await helpers.clickElement('confirm-import-button');
    await helpers.waitForLoadingComplete();
    
    // Verify import success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('2 transactions imported');
  });

  test('should set and track financial goals', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    
    // Open goal settings
    await helpers.clickElement('goal-settings-button');
    await expect(page.locator('[data-testid="goal-settings-modal"]')).toBeVisible();
    
    // Set new goal
    await helpers.fillField('yearly-goal-input', '600000');
    await helpers.fillField('monthly-goal-input', '50000');
    await helpers.clickElement('save-goals-button');
    
    await helpers.waitForLoadingComplete();
    
    // Verify goal was updated
    await expect(page.locator('[data-testid="yearly-goal-metric"]')).toContainText('$600,000');
    
    // Check progress recalculation
    const progressText = await page.locator('[data-testid="goal-progress-text"]').textContent();
    expect(progressText).toContain('27%'); // 160k / 600k ≈ 27%
  });

  test('should handle transaction editing', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    await helpers.waitForLoadingComplete();
    
    // Click edit on first transaction
    await helpers.clickElement('transaction-edit-button');
    await expect(page.locator('[data-testid="transaction-form-modal"]')).toBeVisible();
    
    // Update transaction details
    await page.fill('[data-testid="transaction-price-input"]', '');
    await helpers.fillField('transaction-price-input', '475000');
    await page.selectOption('[data-testid="transaction-status-select"]', 'Closed');
    
    // Save changes
    await helpers.clickElement('save-transaction-button');
    await helpers.waitForLoadingComplete();
    
    // Verify changes
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-row"]').first()).toContainText('$475,000');
    await expect(page.locator('[data-testid="transaction-row"]').first()).toContainText('Closed');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.navigateTo('/revenue-analytics');
    
    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-revenue-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-chart-container"]')).toBeVisible();
    
    // Check mobile transaction table (should be scrollable)
    await expect(page.locator('[data-testid="mobile-transaction-table"]')).toBeVisible();
    
    // Test mobile add transaction FAB
    await expect(page.locator('[data-testid="mobile-add-transaction-fab"]')).toBeVisible();
    await helpers.clickElement('mobile-add-transaction-fab');
    await expect(page.locator('[data-testid="transaction-form-modal"]')).toBeVisible();
  });

  test('should handle commission calculator', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    
    // Open commission calculator
    await helpers.clickElement('commission-calculator-button');
    await expect(page.locator('[data-testid="commission-calculator-modal"]')).toBeVisible();
    
    // Input values
    await helpers.fillField('calc-sale-price-input', '500000');
    await helpers.fillField('calc-commission-rate-input', '3.5');
    await helpers.fillField('calc-broker-split-input', '60');
    
    // Check calculations
    await expect(page.locator('[data-testid="calc-gross-commission"]')).toContainText('$17,500');
    await expect(page.locator('[data-testid="calc-broker-commission"]')).toContainText('$7,000');
    await expect(page.locator('[data-testid="calc-agent-commission"]')).toContainText('$10,500');
    
    // Test different commission structures
    await page.selectOption('[data-testid="commission-structure-select"]', 'tiered');
    await helpers.waitForLoadingComplete();
    
    // Calculations should update for tiered structure
    await expect(page.locator('[data-testid="calc-gross-commission"]')).not.toContainText('$17,500');
  });

  test('should validate financial data inputs', async ({ page }) => {
    await helpers.navigateTo('/revenue-analytics');
    await helpers.clickElement('add-transaction-button');
    
    // Test negative price validation
    await helpers.fillField('transaction-price-input', '-100000');
    await helpers.clickElement('save-transaction-button');
    await expect(page.locator('[data-testid="price-error"]')).toContainText('must be positive');
    
    // Test commission rate validation
    await helpers.fillField('transaction-price-input', '400000');
    await helpers.fillField('transaction-commission-rate-input', '15');
    await helpers.clickElement('save-transaction-button');
    await expect(page.locator('[data-testid="commission-rate-error"]')).toContainText('reasonable range');
    
    // Test required fields
    await page.fill('[data-testid="transaction-address-input"]', '');
    await helpers.clickElement('save-transaction-button');
    await expect(page.locator('[data-testid="address-error"]')).toBeVisible();
  });
});