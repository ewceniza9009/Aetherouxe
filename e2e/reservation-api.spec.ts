import { test, expect, request } from '@playwright/test';

const BASE_URL = 'http://localhost:7077';
const API_BASE = `${BASE_URL}/api`;

test.describe('Reservation Feature - API Verification', () => {
  let token: string;
  let apiRequest;

  test.beforeAll(async () => {
    apiRequest = await request.newContext();
    const response = await apiRequest.post(`${BASE_URL}/api/auth/login`, {
      data: { email: 'admin@elite-realty.com', password: 'Admin123!' },
    });
    const data = await response.json();
    token = data.data.accessToken;
  });

  test('All 8 scheme types: create reservation + convert to sale', async () => {
    const schemes = await apiRequest.get(`${API_BASE}/schemes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const schemesData = await schemes.json();

    for (const scheme of schemesData.data) {
      // Get available unit
      const units = await apiRequest.get(`${API_BASE}/units?status=available&take=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const unitsData = await units.json();
      const unit = unitsData.data[0];

      // Create reservation
      const reservation = await apiRequest.post(`${API_BASE}/reservations`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          unitId: unit.id,
          schemeId: scheme.id,
          prospectName: `Prospect ${scheme.code}`,
          prospectContact: 'test@example.com',
          holdDays: 30,
          collectFeeNow: true,
        },
      });
      const resData = await reservation.json();
      expect(resData.data.status).toBe('reserved');
      expect(resData.data.holdingFeeCollected).toBe(true);

      // Convert to sale
      const convert = await apiRequest.post(`${API_BASE}/reservations/${resData.data.id}/convert`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          performedByUserId: 'adb676df-5dc1-49f6-82e4-dc27ddbd30a6',
          buyerUserId: 'abed9b84-5d45-48bd-b472-bc87c0167230',
          agentId: 'd66cbe6d-ca3c-4e5d-a17a-e707097ee6cc',
          totalContractValue: unit.listPrice,
          monthlyRentAmount: scheme.schemeType === 'rent_to_own' ? 10000 : undefined,
        },
      });
      const convData = await convert.json();
      expect(convData.data.leaseId).toBeTruthy();
    }
  });
});
