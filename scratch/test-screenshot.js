const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://resident.localhost:7077/login');
  await page.fill('input[type="email"]', 'resident1@elite-realty.com');
  await page.fill('input[type="password"]', 'Tenant123!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'scratch/resident-live-dashboard.png', fullPage: true });
  console.log('Screenshot saved to scratch/resident-live-dashboard.png');

  await page.goto('http://resident.localhost:7077/amenities');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/resident-live-amenities.png', fullPage: true });
  console.log('Amenities screenshot saved to scratch/resident-live-amenities.png');

  await browser.close();
})();
