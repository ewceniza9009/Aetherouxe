import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { request } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:7077';

let token: string;
let apiRequest: APIRequestContext;

test.beforeAll(async () => {
  apiRequest = await request.newContext();
  const response = await apiRequest.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: process.env.E2E_ADMIN_EMAIL || 'admin@elite-realty.com',
      password: process.env.E2E_ADMIN_PASSWORD || 'Admin123!',
    },
  });
  const data = await response.json();
  token = data.data.accessToken;
});

async function getAvailableUnitId(request: APIRequestContext, token: string) {
  const response = await request.get(`${BASE_URL}/api/units?status=available&take=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  const units = data.data.filter((u: any) => u.status === 'available' && u.listPrice > 0);
  if (units.length === 0) throw new Error('No available units');
  return units[0].id;
}

async function createReservationViaUI(
  page: Page,
  unitId: string,
  schemeCode: string,
  prospectName: string,
) {
  // Navigate to unit edit page
  await page.goto(`${BASE_URL}/properties/0/units/${unitId}/edit`);
  await page.waitForSelector('button:has-text("Reserve")', { timeout: 30000 });

  // Click Reserve button
  await page.click('button:has-text("Reserve")');
  await page.waitForSelector('dialog[role="dialog"]', { timeout: 10000 });

  // Fill prospect details
  await page.fill('input[placeholder*="Juan"]', prospectName || `Prospect ${Date.now()}`);

  // Select scheme - find by code
  await page.click('select[required]');
  await page.waitForSelector('select[required] option', { timeout: 5000 });
  const options = await page.locator('select[required] option').all();
  for (const opt of options) {
    const text = await opt.textContent();
    if (
      text?.includes('Rent-to-Own') ||
      text?.includes('Standard Rental') ||
      text?.includes('Installment')
    ) {
      await opt.click();
      break;
    }
  }

  // Submit
  await page.click('button:has-text("Reserve Unit")');
  await page.waitForSelector('dialog[role="dialog"]', { state: 'hidden', timeout: 10000 });
}

async function convertReservationViaUI(page: Page, unitId: string) {
  // Navigate to reservations page
  await page.goto(`${BASE_URL}/reservations`);
  await page.waitForSelector('table tbody tr', { timeout: 10000 });

  // Find the reservation and click Convert
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    if (
      await row
        .locator('td:first-child')
        .textContent()
        .then((t: string | null) => t?.includes('Reserved'))
    ) {
      await row.locator('button:has-text("Convert to Sale")').click();
      await page.waitForURL('**/units/*/edit', { timeout: 10000 });
      return true;
    }
  }
  return false;
}

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await page.fill('input[type="email"]', process.env.E2E_ADMIN_EMAIL || 'admin@elite-realty.com');
  await page.fill('input[type="password"]', process.env.E2E_ADMIN_PASSWORD || 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 });
  await page.waitForSelector('button:has-text("Reserve")', { timeout: 10000 });
}

test.describe('Reservation Feature - Leasing / Rent-to-Own / Buying', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Leasing: Reserve unit with Standard Rental scheme and convert to lease', async ({
    page,
  }) => {
    const unitId = await getAvailableUnitId(apiRequest, token);
    await createReservationViaUI(page, unitId, 'Standard Rental', 'Lease Prospect');

    // Verify reservation created (unit should show reserved)
    await page.goto(`${BASE_URL}/properties/0/units/${unitId}/edit`);
    await expect(page.locator('text=Reserved').first()).toBeVisible({ timeout: 10000 });

    // Convert to lease
    const converted = await convertReservationViaUI(page, unitId);
    expect(converted).toBe(true);
  });

  test('Rent-to-Own: Reserve unit with RTO scheme and convert to RTO contract', async ({
    page,
  }) => {
    const unitId = await getAvailableUnitId(apiRequest, token);
    await createReservationViaUI(page, unitId, 'Rent-to-Own', 'RTO Prospect');

    const converted = await convertReservationViaUI(page, unitId);
    expect(converted).toBe(true);
  });

  test('Buying: Reserve unit with Installment scheme and convert to sale', async ({ page }) => {
    const unitId = await getAvailableUnitId(apiRequest, token);
    await createReservationViaUI(page, unitId, 'Installment', 'Buyer Prospect');

    const converted = await convertReservationViaUI(page, unitId);
    expect(converted).toBe(true);
  });
});
