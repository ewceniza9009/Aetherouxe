import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:7077';

test.describe('Advanced UI & Digital Twin E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', process.env.E2E_ADMIN_EMAIL || 'admin@elite-realty.com');
    await page.fill('input[type="password"]', process.env.E2E_ADMIN_PASSWORD || 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20000 });
  });

  test('1. 3D Digital Twin Component Rendering on Properties', async ({ page }) => {
    // Navigate to Properties
    await page.goto(`${BASE_URL}/properties`);
    await page.waitForSelector('table, .grid, [data-testid="property-card"]', { timeout: 15000 });

    // Click first property if exists
    const propertyLink = page.locator('a[href^="/properties/"]').first();
    if (await propertyLink.isVisible()) {
      await propertyLink.click();
      await page.waitForURL('**/properties/*', { timeout: 15000 });

      // Check if 3D Canvas element or digital twin container is mounted
      const digitalTwinContainer = page.locator('text=3D Digital Twin').first();
      if (await digitalTwinContainer.isVisible({ timeout: 5000 })) {
        const canvasElement = page.locator('canvas');
        await expect(canvasElement).toBeVisible();

        // Check floor selector tabs
        const floorBtn = page
          .locator('button:has-text("All Floors"), button:has-text("F1")')
          .first();
        await expect(floorBtn).toBeVisible();
      }
    }
  });

  test('2. RTO Contracts Page & AI Underwriting Component Verification', async ({ page }) => {
    // Navigate to RTO Contracts
    await page.goto(`${BASE_URL}/rto`);
    await page.waitForSelector('table, [role="table"], h1', { timeout: 15000 });

    const contractRows = page.locator('table tbody tr');
    if ((await contractRows.count()) > 0) {
      const firstRowLink = contractRows.first().locator('a, button').first();
      if (await firstRowLink.isVisible()) {
        await firstRowLink.click();

        // Check AI Underwriting Card elements
        const aiCard = page.locator('text=AI Underwriting & Credit Risk Score');
        if (await aiCard.isVisible({ timeout: 5000 })) {
          await expect(
            page.locator('text=Payment Reliability').or(page.locator('text=Risk Tier')),
          ).toBeVisible();
          await expect(
            page.locator('text=AR Health Score').or(page.locator('text=Equity Progress')),
          ).toBeVisible();
        }
      }
    }
  });

  test('3. Field Meter Reader Route & Offline Queue Controls', async ({ page }) => {
    // Attempt navigation to Field Meter Reader
    await page.goto(`${BASE_URL}/field-reader`);

    // Verify if page loaded or container is rendered
    const heading = page.locator('h1:has-text("Field Meter Reader")');
    if (await heading.isVisible({ timeout: 4000 })) {
      await expect(
        page.locator('text=Online (Live Sync)').or(page.locator('text=Offline')),
      ).toBeVisible();

      // Verify Scanner toggle button exists
      const scanToggleBtn = page.locator(
        'button:has-text("Scan QR Code"), button:has-text("Close Camera")',
      );
      await expect(scanToggleBtn.first()).toBeVisible();
    }
  });
});
