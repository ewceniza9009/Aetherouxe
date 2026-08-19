import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:7077';

test.describe('New Features E2E Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate with admin credentials
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', process.env.E2E_ADMIN_EMAIL || 'admin@elite-realty.com');
    await page.fill('input[type="password"]', process.env.E2E_ADMIN_PASSWORD || 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20000 });
  });

  test('1. Title Transfers 6-Stage Legal Handover Stepper', async ({ page }) => {
    await page.goto(`${BASE_URL}/titles`);
    await page.waitForSelector('h1:has-text("Title Transfers")', { timeout: 15000 });

    // Assert Stepper Banner is visible
    const stepperBanner = page.locator('text=Standard Legal Title Handover Pipeline');
    await expect(stepperBanner).toBeVisible();

    // Verify key legal stages in the stepper
    await expect(page.locator('text=Tax Clearance').first()).toBeVisible();
    await expect(page.locator('text=BIR CAR').first()).toBeVisible();
    await expect(page.locator('text=DOAS Notarized').first()).toBeVisible();
    await expect(page.locator('text=Key Turnover').first()).toBeVisible();
  });

  test('2. Maintenance Ticket Kanban & Vendor Dispatch Flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/maintenance/kanban`);
    await page.waitForSelector('h1:has-text("Maintenance Kanban")', { timeout: 15000 });

    // Assert Triage Lanes are rendered
    await expect(page.locator('text=New Requests').first()).toBeVisible();
    await expect(page.locator('text=Dispatched').first()).toBeVisible();
    await expect(page.locator('text=In Progress').first()).toBeVisible();
    await expect(page.locator('text=Completed').first()).toBeVisible();

    // Check action buttons or filters
    const filterInput = page.locator('input[placeholder*="Search tickets"]');
    await expect(filterInput).toBeVisible();
  });

  test('3. Resident Amenities & Leisure Booking System', async ({ page }) => {
    await page.goto(`${BASE_URL}/amenities`);
    await page.waitForSelector('h1, h2, table, .grid', { timeout: 15000 });

    // Check if reserve/book buttons exist
    const reserveBtn = page
      .locator('button:has-text("Reserve Facility"), button:has-text("Book Now")')
      .first();
    if (await reserveBtn.isVisible({ timeout: 5000 })) {
      await reserveBtn.click();
      // Assert booking modal opens
      const modalHeader = page.locator('h3:has-text("Book")');
      await expect(modalHeader).toBeVisible();

      // Verify date / time picker controls
      await expect(page.locator('input[type="date"]')).toBeVisible();
      await expect(page.locator('input[type="time"]').first()).toBeVisible();
    }
  });

  test('4. Field Meter Reader & Anomaly Detection Entrypoint', async ({ page }) => {
    await page.goto(`${BASE_URL}/field-reader`);
    await page.waitForSelector('h1:has-text("Field Meter Reader")', { timeout: 15000 });

    // Verify OCR / Manual reading capture modes
    await expect(page.locator('text=Camera OCR').first()).toBeVisible();
    await expect(page.locator('text=Manual Entry').first()).toBeVisible();
  });
});
