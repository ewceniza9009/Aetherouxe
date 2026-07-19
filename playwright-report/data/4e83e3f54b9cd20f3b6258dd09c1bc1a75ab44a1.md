# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reservation-api.spec.ts >> Reservation Feature - API Verification >> All 8 scheme types: create reservation + convert to sale
- Location: e2e\reservation-api.spec.ts:19:7

# Error details

```
TypeError: Cannot read properties of undefined (reading 'leaseId')
```

# Test source

```ts
  1  | import { test, expect, request } from '@playwright/test';
  2  |
  3  | const BASE_URL = 'http://localhost:7077';
  4  | const API_BASE = `${BASE_URL}/api`;
  5  |
  6  | test.describe('Reservation Feature - API Verification', () => {
  7  |   let token: string;
  8  |   let apiRequest;
  9  |
  10 |   test.beforeAll(async () => {
  11 |     apiRequest = await request.newContext();
  12 |     const response = await apiRequest.post(`${BASE_URL}/api/auth/login`, {
  13 |       data: { email: 'admin@elite-realty.com', password: 'Admin123!' },
  14 |     });
  15 |     const data = await response.json();
  16 |     token = data.data.accessToken;
  17 |   });
  18 |
  19 |   test('All 8 scheme types: create reservation + convert to sale', async () => {
  20 |     const schemes = await apiRequest.get(`${API_BASE}/schemes`, {
  21 |       headers: { Authorization: `Bearer ${token}` },
  22 |     });
  23 |     const schemesData = await schemes.json();
  24 |
  25 |     for (const scheme of schemesData.data) {
  26 |       // Get available unit
  27 |       const units = await apiRequest.get(`${API_BASE}/units?status=available&take=1`, {
  28 |         headers: { Authorization: `Bearer ${token}` },
  29 |       });
  30 |       const unitsData = await units.json();
  31 |       const unit = unitsData.data[0];
  32 |
  33 |       // Create reservation
  34 |       const reservation = await apiRequest.post(`${API_BASE}/reservations`, {
  35 |         headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  36 |         data: {
  37 |           unitId: unit.id,
  38 |           schemeId: scheme.id,
  39 |           prospectName: `Prospect ${scheme.code}`,
  40 |           prospectContact: 'test@example.com',
  41 |           holdDays: 30,
  42 |           collectFeeNow: true,
  43 |         },
  44 |       });
  45 |       const resData = await reservation.json();
  46 |       expect(resData.data.status).toBe('reserved');
  47 |       expect(resData.data.holdingFeeCollected).toBe(true);
  48 |
  49 |       // Convert to sale
  50 |       const convert = await apiRequest.post(`${API_BASE}/reservations/${resData.data.id}/convert`, {
  51 |         headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  52 |         data: {
  53 |           performedByUserId: 'adb676df-5dc1-49f6-82e4-dc27ddbd30a6',
  54 |           buyerUserId: 'abed9b84-5d45-48bd-b472-bc87c0167230',
  55 |           agentId: 'd66cbe6d-ca3c-4e5d-a17a-e707097ee6cc',
  56 |           totalContractValue: unit.listPrice,
  57 |           monthlyRentAmount: scheme.schemeType === 'rent_to_own' ? 10000 : undefined,
  58 |         },
  59 |       });
  60 |       const convData = await convert.json();
> 61 |       expect(convData.data.leaseId).toBeTruthy();
     |                            ^ TypeError: Cannot read properties of undefined (reading 'leaseId')
  62 |     }
  63 |   });
  64 | });
```
