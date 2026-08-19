# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: new-features.spec.ts >> New Features E2E Verification Suite >> 1. Title Transfers 6-Stage Legal Handover Stepper
- Location: e2e\new-features.spec.ts:16:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('h1:has-text("Title Transfers")') to be visible

```

# Page snapshot

```yaml
- paragraph [ref=e3]: Not Found
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:7077';
  4  |
  5  | test.describe('New Features E2E Verification Suite', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     // Authenticate with admin credentials
  8  |     await page.goto(`${BASE_URL}/login`);
  9  |     await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  10 |     await page.fill('input[type="email"]', process.env.E2E_ADMIN_EMAIL || 'admin@elite-realty.com');
  11 |     await page.fill('input[type="password"]', process.env.E2E_ADMIN_PASSWORD || 'Admin123!');
  12 |     await page.click('button[type="submit"]');
  13 |     await page.waitForURL('**/dashboard', { timeout: 20000 });
  14 |   });
  15 |
  16 |   test('1. Title Transfers 6-Stage Legal Handover Stepper', async ({ page }) => {
  17 |     await page.goto(`${BASE_URL}/titles`);
> 18 |     await page.waitForSelector('h1:has-text("Title Transfers")', { timeout: 15000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  19 |
  20 |     // Assert Stepper Banner is visible
  21 |     const stepperBanner = page.locator('text=Standard Legal Title Handover Pipeline');
  22 |     await expect(stepperBanner).toBeVisible();
  23 |
  24 |     // Verify key legal stages in the stepper
  25 |     await expect(page.locator('text=Tax Clearance').first()).toBeVisible();
  26 |     await expect(page.locator('text=BIR CAR').first()).toBeVisible();
  27 |     await expect(page.locator('text=DOAS Notarized').first()).toBeVisible();
  28 |     await expect(page.locator('text=Key Turnover').first()).toBeVisible();
  29 |   });
  30 |
  31 |   test('2. Maintenance Ticket Kanban & Vendor Dispatch Flow', async ({ page }) => {
  32 |     await page.goto(`${BASE_URL}/maintenance/kanban`);
  33 |     await page.waitForSelector('h1:has-text("Maintenance Kanban")', { timeout: 15000 });
  34 |
  35 |     // Assert Triage Lanes are rendered
  36 |     await expect(page.locator('text=New Requests').first()).toBeVisible();
  37 |     await expect(page.locator('text=Dispatched').first()).toBeVisible();
  38 |     await expect(page.locator('text=In Progress').first()).toBeVisible();
  39 |     await expect(page.locator('text=Completed').first()).toBeVisible();
  40 |
  41 |     // Check action buttons or filters
  42 |     const filterInput = page.locator('input[placeholder*="Search tickets"]');
  43 |     await expect(filterInput).toBeVisible();
  44 |   });
  45 |
  46 |   test('3. Resident Amenities & Leisure Booking System', async ({ page }) => {
  47 |     await page.goto(`${BASE_URL}/amenities`);
  48 |     await page.waitForSelector('h1, h2, table, .grid', { timeout: 15000 });
  49 |
  50 |     // Check if reserve/book buttons exist
  51 |     const reserveBtn = page.locator('button:has-text("Reserve Facility"), button:has-text("Book Now")').first();
  52 |     if (await reserveBtn.isVisible({ timeout: 5000 })) {
  53 |       await reserveBtn.click();
  54 |       // Assert booking modal opens
  55 |       const modalHeader = page.locator('h3:has-text("Book")');
  56 |       await expect(modalHeader).toBeVisible();
  57 |
  58 |       // Verify date / time picker controls
  59 |       await expect(page.locator('input[type="date"]')).toBeVisible();
  60 |       await expect(page.locator('input[type="time"]').first()).toBeVisible();
  61 |     }
  62 |   });
  63 |
  64 |   test('4. Field Meter Reader & Anomaly Detection Entrypoint', async ({ page }) => {
  65 |     await page.goto(`${BASE_URL}/field-reader`);
  66 |     await page.waitForSelector('h1:has-text("Field Meter Reader")', { timeout: 15000 });
  67 |
  68 |     // Verify OCR / Manual reading capture modes
  69 |     await expect(page.locator('text=Camera OCR').first()).toBeVisible();
  70 |     await expect(page.locator('text=Manual Entry').first()).toBeVisible();
  71 |   });
  72 | });
  73 |
```
