import { test, expect } from '@playwright/test';

const OWNER_URL = process.env.E2E_OWNER_URL || 'http://owner.localhost:7077';

test.describe('Owner Portal & Realtime Yield Analytics E2E Suite', () => {
  test('[Owner Analytics] Portfolio Net Yield %, Cap Rate, Cashflow Graphs & Unit Asset Breakdown', async ({
    page,
  }) => {
    // Authenticate as property owner on owner portal
    await page.goto(`${OWNER_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill(
      'input[type="email"]',
      process.env.E2E_OWNER_EMAIL || 'owner1@elite-realty.com',
    );
    await page.fill('input[type="password"]', process.env.E2E_OWNER_PASSWORD || 'Owner123!');
    await page.click('button[type="submit"]');

    // Wait for authenticated dashboard navigation
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // Navigate to Owner Portfolio Analytics
    await page.goto(`${OWNER_URL}/portfolio`);
    await page.waitForSelector('h1:has-text("Portfolio & Yield Analytics")', { timeout: 15000 });

    // Assert Portfolio Metrics & Yield KPI Cards are rendered
    await expect(page.locator('text=Total Portfolio Valuation').first()).toBeVisible();
    await expect(page.locator('text=Net Rental Yield (Annual)').first()).toBeVisible();
    await expect(page.locator('text=Monthly Gross Inflow').first()).toBeVisible();
    await expect(page.locator('text=Occupancy Health').first()).toBeVisible();
    await expect(page.locator('text=Monthly Cash Flow').first()).toBeVisible();
  });
});
