import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import { testUsers, testAppointments } from './fixtures/test-data';

test.describe('Calendar and Scheduling System', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login();
  });

  test('should display calendar view correctly', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    
    // Check calendar components
    await expect(page.locator('[data-testid="calendar-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-view-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-appointment-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-navigation"]')).toBeVisible();
  });

  test('should switch between calendar views', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    
    // Test month view (default)
    await expect(page.locator('[data-testid="month-view"]')).toBeVisible();
    
    // Switch to week view
    await helpers.clickElement('week-view-button');
    await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="week-days-header"]')).toBeVisible();
    
    // Switch to day view
    await helpers.clickElement('day-view-button');
    await expect(page.locator('[data-testid="day-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="day-time-slots"]')).toBeVisible();
    
    // Switch back to month view
    await helpers.clickElement('month-view-button');
    await expect(page.locator('[data-testid="month-view"]')).toBeVisible();
  });

  test('should create new appointment successfully', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    
    // Open appointment form
    await helpers.clickElement('add-appointment-button');
    await expect(page.locator('[data-testid="appointment-form-modal"]')).toBeVisible();
    
    // Fill appointment form
    const appointment = testAppointments.showing;
    await helpers.fillField('appointment-title-input', appointment.title);
    await helpers.fillField('appointment-description-textarea', appointment.description);
    await page.selectOption('[data-testid="appointment-type-select"]', appointment.type);
    await helpers.fillField('appointment-start-time-input', '2024-04-15T14:00');
    await helpers.fillField('appointment-end-time-input', '2024-04-15T15:00');
    await helpers.fillField('appointment-location-input', appointment.location);
    
    // Select client (if available)
    const clientSelect = page.locator('[data-testid="appointment-client-select"]');
    if (await clientSelect.isVisible()) {
      await clientSelect.selectOption({ index: 1 });
    }
    
    // Submit form
    await helpers.clickElement('save-appointment-button');
    await helpers.waitForLoadingComplete();
    
    // Verify appointment was created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-event"]').filter({ hasText: appointment.title })).toBeVisible();
  });

  test('should edit existing appointment', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    await helpers.waitForLoadingComplete();
    
    // Click on existing appointment
    await helpers.clickElement('appointment-event');
    await expect(page.locator('[data-testid="appointment-details-modal"]')).toBeVisible();
    
    // Click edit button
    await helpers.clickElement('edit-appointment-button');
    await expect(page.locator('[data-testid="appointment-form-modal"]')).toBeVisible();
    
    // Update appointment
    const updatedTitle = 'Updated Property Showing';
    await page.fill('[data-testid="appointment-title-input"]', '');
    await helpers.fillField('appointment-title-input', updatedTitle);
    
    // Save changes
    await helpers.clickElement('save-appointment-button');
    await helpers.waitForLoadingComplete();
    
    // Verify changes
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-event"]').filter({ hasText: updatedTitle })).toBeVisible();
  });

  test('should handle appointment drag and drop rescheduling', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    await helpers.waitForLoadingComplete();
    
    // Get appointment element
    const appointment = page.locator('[data-testid="appointment-event"]').first();
    const targetSlot = page.locator('[data-testid="calendar-time-slot"]').nth(5);
    
    // Perform drag and drop
    await appointment.dragTo(targetSlot);
    
    // Confirm reschedule
    await expect(page.locator('[data-testid="reschedule-confirmation-modal"]')).toBeVisible();
    await helpers.clickElement('confirm-reschedule-button');
    
    await helpers.waitForLoadingComplete();
    
    // Verify appointment was moved
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should manage recurring appointments', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    
    // Create recurring appointment
    await helpers.clickElement('add-appointment-button');
    await helpers.fillField('appointment-title-input', 'Weekly Team Meeting');
    await helpers.fillField('appointment-start-time-input', '2024-04-15T09:00');
    await helpers.fillField('appointment-end-time-input', '2024-04-15T10:00');
    
    // Set recurrence
    await helpers.clickElement('recurring-appointment-checkbox');
    await page.selectOption('[data-testid="recurrence-pattern-select"]', 'weekly');
    await helpers.fillField('recurrence-end-date-input', '2024-06-15');
    
    await helpers.clickElement('save-appointment-button');
    await helpers.waitForLoadingComplete();
    
    // Verify recurring appointments were created
    await expect(page.locator('[data-testid="success-message"]')).toContainText('recurring appointments created');
    
    // Navigate to next week and verify appointment exists
    await helpers.clickElement('next-week-button');
    await expect(page.locator('[data-testid="appointment-event"]').filter({ hasText: 'Weekly Team Meeting' })).toBeVisible();
  });

  test('should integrate with external calendars', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    
    // Open calendar integration settings
    await helpers.clickElement('calendar-settings-button');
    await expect(page.locator('[data-testid="calendar-integration-modal"]')).toBeVisible();
    
    // Test Google Calendar integration
    await helpers.clickElement('connect-google-calendar-button');
    
    // Mock OAuth flow
    await page.route('**/auth/google**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, connected: true })
      });
    });
    
    // Verify connection status
    await expect(page.locator('[data-testid="google-calendar-status"]')).toContainText('Connected');
    
    // Test sync functionality
    await helpers.clickElement('sync-calendars-button');
    await helpers.waitForLoadingComplete();
    
    await expect(page.locator('[data-testid="sync-success-message"]')).toBeVisible();
  });

  test('should track and display deadlines', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    
    // Check deadline tracker component
    await expect(page.locator('[data-testid="deadline-tracker"]')).toBeVisible();
    await expect(page.locator('[data-testid="upcoming-deadlines-list"]')).toBeVisible();
    
    // Create new deadline
    await helpers.clickElement('add-deadline-button');
    await expect(page.locator('[data-testid="deadline-form-modal"]')).toBeVisible();
    
    await helpers.fillField('deadline-title-input', 'Contract Submission Deadline');
    await helpers.fillField('deadline-date-input', '2024-04-20');
    await helpers.fillField('deadline-time-input', '17:00');
    await page.selectOption('[data-testid="deadline-priority-select"]', 'high');
    
    await helpers.clickElement('save-deadline-button');
    await helpers.waitForLoadingComplete();
    
    // Verify deadline appears in tracker
    await expect(page.locator('[data-testid="deadline-item"]').filter({ hasText: 'Contract Submission' })).toBeVisible();
    await expect(page.locator('[data-testid="deadline-priority-badge"]')).toContainText('High');
  });

  test('should send appointment notifications', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    
    // Create appointment with notifications
    await helpers.clickElement('add-appointment-button');
    await helpers.fillField('appointment-title-input', 'Client Meeting');
    await helpers.fillField('appointment-start-time-input', '2024-04-16T14:00');
    await helpers.fillField('appointment-end-time-input', '2024-04-16T15:00');
    
    // Configure notifications
    await helpers.clickElement('notification-settings-toggle');
    await helpers.clickElement('email-notification-checkbox');
    await helpers.clickElement('sms-notification-checkbox');
    await page.selectOption('[data-testid="reminder-time-select"]', '30'); // 30 minutes before
    
    await helpers.clickElement('save-appointment-button');
    await helpers.waitForLoadingComplete();
    
    // Verify notification settings were saved
    await expect(page.locator('[data-testid="success-message"]')).toContainText('notifications scheduled');
  });

  test('should display public calendar view', async ({ page }) => {
    // Navigate to public calendar (no authentication required)
    await page.goto('/calendar/public/test-agent-id');
    
    // Check public calendar components
    await expect(page.locator('[data-testid="public-calendar-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="public-calendar-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="book-appointment-button"]')).toBeVisible();
    
    // Verify no sensitive information is displayed
    await expect(page.locator('[data-testid="appointment-details"]')).not.toBeVisible();
    
    // Test appointment booking
    await helpers.clickElement('available-time-slot');
    await expect(page.locator('[data-testid="booking-form-modal"]')).toBeVisible();
    
    await helpers.fillField('client-name-input', 'John Public');
    await helpers.fillField('client-email-input', 'john@example.com');
    await helpers.fillField('client-phone-input', '+1234567890');
    await helpers.fillField('appointment-reason-textarea', 'Property viewing inquiry');
    
    await helpers.clickElement('book-appointment-button');
    await helpers.waitForLoadingComplete();
    
    await expect(page.locator('[data-testid="booking-success-message"]')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.navigateTo('/calendar');
    
    // Check mobile calendar layout
    await expect(page.locator('[data-testid="mobile-calendar-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-calendar-grid"]')).toBeVisible();
    
    // Test mobile appointment creation
    await helpers.clickElement('mobile-add-appointment-fab');
    await expect(page.locator('[data-testid="appointment-form-modal"]')).toBeVisible();
    
    // Check mobile-optimized form
    await expect(page.locator('[data-testid="mobile-form-layout"]')).toBeVisible();
  });

  test('should handle calendar navigation', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    
    // Test month navigation
    const currentMonth = await page.locator('[data-testid="current-month-year"]').textContent();
    
    // Navigate to next month
    await helpers.clickElement('next-month-button');
    const nextMonth = await page.locator('[data-testid="current-month-year"]').textContent();
    expect(nextMonth).not.toBe(currentMonth);
    
    // Navigate to previous month
    await helpers.clickElement('previous-month-button');
    const backToOriginal = await page.locator('[data-testid="current-month-year"]').textContent();
    expect(backToOriginal).toBe(currentMonth);
    
    // Test "Today" button
    await helpers.clickElement('today-button');
    const todayMonth = await page.locator('[data-testid="current-month-year"]').textContent();
    
    // Should navigate to current month
    const now = new Date();
    const expectedMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(todayMonth).toContain(expectedMonth.split(' ')[0]); // Check month name
  });

  test('should validate appointment form inputs', async ({ page }) => {
    await helpers.navigateTo('/calendar');
    await helpers.clickElement('add-appointment-button');
    
    // Try to submit empty form
    await helpers.clickElement('save-appointment-button');
    
    // Check validation errors
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-time-error"]')).toBeVisible();
    
    // Test invalid time range
    await helpers.fillField('appointment-title-input', 'Test Appointment');
    await helpers.fillField('appointment-start-time-input', '2024-04-15T15:00');
    await helpers.fillField('appointment-end-time-input', '2024-04-15T14:00'); // End before start
    
    await helpers.clickElement('save-appointment-button');
    await expect(page.locator('[data-testid="time-range-error"]')).toContainText('end time must be after start time');
    
    // Test past date validation
    await helpers.fillField('appointment-start-time-input', '2020-01-01T10:00');
    await helpers.fillField('appointment-end-time-input', '2020-01-01T11:00');
    
    await helpers.clickElement('save-appointment-button');
    await expect(page.locator('[data-testid="past-date-error"]')).toContainText('cannot schedule appointments in the past');
  });
});