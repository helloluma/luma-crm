import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers, testClients } from './fixtures/test-data';

test.describe('Client Management System', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
  });

  test('should display clients list page correctly', async ({ page }) => {
    await helpers.navigateTo('/clients');
    
    // Check page elements
    await expect(page.locator('[data-testid="clients-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-client-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-search-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-filter-dropdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="clients-grid"]')).toBeVisible();
  });

  test('should create new client successfully', async ({ page }) => {
    await helpers.navigateTo('/clients');
    
    // Open add client form
    await helpers.clickElement('add-client-button');
    await expect(page.locator('[data-testid="client-form-modal"]')).toBeVisible();
    
    // Fill client form
    const newClient = testClients.lead;
    await helpers.fillField('client-name-input', newClient.name);
    await helpers.fillField('client-email-input', newClient.email);
    await helpers.fillField('client-phone-input', newClient.phone);
    await page.selectOption('[data-testid="client-type-select"]', newClient.type);
    await helpers.fillField('client-source-input', newClient.source);
    await helpers.fillField('client-budget-min-input', newClient.budgetMin.toString());
    await helpers.fillField('client-budget-max-input', newClient.budgetMax.toString());
    await helpers.fillField('client-preferred-area-input', newClient.preferredArea);
    await helpers.fillField('client-notes-textarea', newClient.notes);
    
    // Submit form
    await helpers.clickElement('save-client-button');
    await helpers.waitForLoadingComplete();
    
    // Verify client was created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-card"]').filter({ hasText: newClient.name })).toBeVisible();
  });

  test('should edit existing client', async ({ page }) => {
    await helpers.navigateTo('/clients');
    
    // Assume there's at least one client in the list
    await helpers.clickElement('client-card-edit-button');
    await expect(page.locator('[data-testid="client-form-modal"]')).toBeVisible();
    
    // Update client information
    const updatedName = 'Updated Client Name';
    await page.fill('[data-testid="client-name-input"]', '');
    await helpers.fillField('client-name-input', updatedName);
    
    // Save changes
    await helpers.clickElement('save-client-button');
    await helpers.waitForLoadingComplete();
    
    // Verify changes were saved
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-card"]').filter({ hasText: updatedName })).toBeVisible();
  });

  test('should search and filter clients', async ({ page }) => {
    await helpers.navigateTo('/clients');
    await helpers.waitForLoadingComplete();
    
    // Test search functionality
    await helpers.fillField('client-search-input', 'John');
    await page.keyboard.press('Enter');
    
    // Check search results
    await expect(page.locator('[data-testid="client-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="client-card"]').first()).toContainText('John');
    
    // Clear search
    await page.fill('[data-testid="client-search-input"]', '');
    await page.keyboard.press('Enter');
    
    // Test filter functionality
    await page.selectOption('[data-testid="client-filter-dropdown"]', 'Lead');
    await helpers.waitForLoadingComplete();
    
    // Check filter results
    const clientCards = page.locator('[data-testid="client-card"]');
    const count = await clientCards.count();
    
    for (let i = 0; i < count; i++) {
      await expect(clientCards.nth(i).locator('[data-testid="client-type-badge"]')).toContainText('Lead');
    }
  });

  test('should display client profile with details', async ({ page }) => {
    await helpers.navigateTo('/clients');
    
    // Click on first client card
    await helpers.clickElement('client-card-view-button');
    
    // Check client profile page
    await expect(page.locator('[data-testid="client-profile-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-contact-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-stage-pipeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-documents-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="client-activity-history"]')).toBeVisible();
  });

  test('should track client stage progression', async ({ page }) => {
    await helpers.navigateTo('/clients');
    await helpers.clickElement('client-card-view-button');
    
    // Check current stage
    await expect(page.locator('[data-testid="current-stage-indicator"]')).toBeVisible();
    
    // Progress to next stage
    await helpers.clickElement('progress-stage-button');
    await expect(page.locator('[data-testid="stage-confirmation-modal"]')).toBeVisible();
    
    await helpers.fillField('stage-notes-textarea', 'Client showed strong interest');
    await helpers.clickElement('confirm-stage-progression');
    
    await helpers.waitForLoadingComplete();
    
    // Verify stage progression
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="stage-history-item"]').first()).toContainText('Prospect');
  });

  test('should manage client documents', async ({ page }) => {
    await helpers.navigateTo('/clients');
    await helpers.clickElement('client-card-view-button');
    
    // Navigate to documents section
    await helpers.clickElement('documents-tab');
    await expect(page.locator('[data-testid="documents-section"]')).toBeVisible();
    
    // Upload document
    await helpers.clickElement('upload-document-button');
    
    // Mock file upload
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test document content')
    });
    
    await helpers.fillField('document-description-input', 'Test document upload');
    await helpers.clickElement('save-document-button');
    
    await helpers.waitForLoadingComplete();
    
    // Verify document was uploaded
    await expect(page.locator('[data-testid="document-item"]').filter({ hasText: 'test-document.pdf' })).toBeVisible();
  });

  test('should handle client deletion', async ({ page }) => {
    await helpers.navigateTo('/clients');
    
    // Click delete button on client card
    await helpers.clickElement('client-card-delete-button');
    
    // Confirm deletion
    await expect(page.locator('[data-testid="delete-confirmation-modal"]')).toBeVisible();
    await helpers.clickElement('confirm-delete-button');
    
    await helpers.waitForLoadingComplete();
    
    // Verify client was deleted
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.navigateTo('/clients');
    
    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-client-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-add-client-fab"]')).toBeVisible();
    
    // Test mobile client card interaction
    await helpers.clickElement('mobile-client-card');
    await expect(page.locator('[data-testid="mobile-client-details"]')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await helpers.navigateTo('/clients');
    await helpers.clickElement('add-client-button');
    
    // Try to submit empty form
    await helpers.clickElement('save-client-button');
    
    // Check validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    
    // Fill invalid email
    await helpers.fillField('client-name-input', 'Test Client');
    await helpers.fillField('client-email-input', 'invalid-email');
    await helpers.clickElement('save-client-button');
    
    // Check email validation error
    await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
  });

  test('should support bulk operations', async ({ page }) => {
    await helpers.navigateTo('/clients');
    await helpers.waitForLoadingComplete();
    
    // Select multiple clients
    await helpers.clickElement('select-all-checkbox');
    await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).toBeVisible();
    
    // Test bulk export
    await helpers.clickElement('bulk-export-button');
    
    // Wait for download to start
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('clients');
    
    // Test bulk stage update
    await helpers.clickElement('bulk-stage-update-button');
    await expect(page.locator('[data-testid="bulk-stage-modal"]')).toBeVisible();
    
    await page.selectOption('[data-testid="bulk-stage-select"]', 'Prospect');
    await helpers.clickElement('apply-bulk-stage-button');
    
    await helpers.waitForLoadingComplete();
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should handle pagination correctly', async ({ page }) => {
    await helpers.navigateTo('/clients');
    await helpers.waitForLoadingComplete();
    
    // Check pagination controls
    await expect(page.locator('[data-testid="pagination-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="pagination-controls"]')).toBeVisible();
    
    // Test page navigation
    if (await page.locator('[data-testid="next-page-button"]').isEnabled()) {
      await helpers.clickElement('next-page-button');
      await helpers.waitForLoadingComplete();
      
      // Check URL updated with page parameter
      expect(page.url()).toContain('page=2');
      
      // Test previous page
      await helpers.clickElement('previous-page-button');
      await helpers.waitForLoadingComplete();
      expect(page.url()).toContain('page=1');
    }
  });
});