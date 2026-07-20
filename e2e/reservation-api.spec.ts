import { test, expect, request, APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:7077';
const API_BASE = `${BASE_URL}/api`;

test.describe('Reservation Feature - API Verification', () => {
  let token: string;
  let apiRequest: APIRequestContext;

  let adminUserId: string;

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
    adminUserId = data.data.user.id;
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
      if (!resData.data) {
        console.error('Reservation failed:', resData);
      }
      expect(resData.data.status).toBe('reserved');
      expect(resData.data.holdingFeeCollected).toBe(true);

      // Get agent ID
      const agentsReq = await apiRequest.get(`${API_BASE}/agents?take=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const agentsData = await agentsReq.json();
      const agentId = agentsData.data[0].id;

      // Convert to sale
      const convert = await apiRequest.post(`${API_BASE}/reservations/${resData.data.id}/convert`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          performedByUserId: adminUserId,
          buyerUserId: adminUserId,
          agentId: agentId,
          totalContractValue: unit.listPrice,
          monthlyRentAmount: scheme.schemeType === 'rent_to_own' ? 10000 : undefined,
        },
      });
      const convData = await convert.json();
      if (!convData.data) {
        console.error('Convert failed:', convData);
      }
      expect(convData.data.leaseId).toBeTruthy();
    }
  });
});
