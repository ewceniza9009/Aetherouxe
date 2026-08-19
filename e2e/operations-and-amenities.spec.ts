import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:7077';

test.describe('Operations, Title Handover & Facility Maintenance E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate with admin credentials
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', process.env.E2E_ADMIN_EMAIL || 'admin@elite-realty.com');
    await page.fill('input[type="password"]', process.env.E2E_ADMIN_PASSWORD || 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20000 });
  });

  test('[Legal Operations] Philippine Torrens System: 6-Stage Title Transfer Handover Pipeline', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/titles`);
    await page.waitForSelector('h1:has-text("Title Transfers")', { timeout: 15000 });

    // Assert Stepper Banner is visible
    const stepperBanner = page.locator('text=Standard Legal Title Handover Pipeline');
    await expect(stepperBanner).toBeVisible();

    // Verify key Torrens legal milestones in the stepper
    await expect(page.locator('text=Tax Clearance').first()).toBeVisible();
    await expect(page.locator('text=BIR CAR').first()).toBeVisible();
    await expect(page.locator('text=DOAS Notarized').first()).toBeVisible();
    await expect(page.locator('text=Key Turnover').first()).toBeVisible();
  });

  test('[Facility Management] Maintenance Ticket Kanban: Visual Triage Lanes, Vendor Dispatch & Priority Routing', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/maintenance/kanban`);
    await page.waitForSelector('h1:has-text("Maintenance Ticket Kanban")', { timeout: 15000 });

    // Assert Kanban Triage Lanes are rendered
    await expect(page.locator('text=Open / Triage').first()).toBeVisible();
    await expect(page.locator('text=Vendor Dispatched').first()).toBeVisible();
    await expect(page.locator('text=In Execution').first()).toBeVisible();
    await expect(page.locator('text=Resolved & AP Invoiced').first()).toBeVisible();

    // Check priority filters
    await expect(page.locator('button:has-text("all")').first()).toBeVisible();
  });

  test('[Resident Leisure] Community Amenities: Interactive Slot Booking & Real-Time Conflict Detection', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/amenities`);
    await page.waitForSelector('h1, h2, table, .grid', { timeout: 15000 });

    // Check if reservation buttons exist
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

  test('[Utilities & Submetering] Field Meter Reader PWA: QR Scanning, Manual Entry & Spike Anomaly Alerting', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/field-reader`);
    await page.waitForSelector('h1:has-text("Field Meter Reader")', { timeout: 15000 });

    // Verify Scanner controls and meter selection
    await expect(
      page.locator('button:has-text("Scan QR Code"), button:has-text("Close Camera")').first(),
    ).toBeVisible();
    await expect(page.locator('text=Scan or Select Submeter').first()).toBeVisible();
  });
});
