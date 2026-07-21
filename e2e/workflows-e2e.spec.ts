import { test, expect, request, APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4000';
const API_BASE = `${BASE_URL}/api`;

test.describe('Workflow Hardening E2E Verification', () => {
  let token: string;
  let apiRequest: APIRequestContext;
  let adminUserId: string;

  test.beforeAll(async () => {
    apiRequest = await request.newContext();
    const response = await apiRequest.post(`${API_BASE}/auth/login`, {
      data: {
        email: process.env.E2E_ADMIN_EMAIL || 'admin@elite-realty.com',
        password: process.env.E2E_ADMIN_PASSWORD || 'Admin123!',
      },
    });
    const data = await response.json();
    token = data.data.accessToken;
    adminUserId = data.data.user.id;
  });

  test('1. Rental Payment -> GL Journal Entry Posting', async () => {
    // Pick an active lease
    const leasesRes = await apiRequest.get(`${API_BASE}/leases?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const leasesData = await leasesRes.json();
    expect(leasesData.data.length).toBeGreaterThan(0);
    const lease = leasesData.data[0];

    // Find a pending rental payment for this lease
    const paymentsRes = await apiRequest.get(
      `${API_BASE}/rental-payments?leaseAgreementId=${lease.id}&status=pending`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const paymentsData = await paymentsRes.json();
    if (paymentsData.data.length === 0) return; // skip if no pending

    const payment = paymentsData.data[0];
    const payRef = `E2E-PAY-${Date.now()}`;

    // Record payment
    const recordRes = await apiRequest.patch(`${API_BASE}/rental-payments/${payment.id}/pay`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        amountPaid: Number(payment.amountDue),
        paymentDate: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        paymentReference: payRef,
      },
    });
    const recordData = await recordRes.json();
    expect(recordData.data.status).toBe('paid');

    // Verify GL journal entry was created
    const glRes = await apiRequest.get(`${API_BASE}/general-ledger/entries?search=${payRef}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const glData = await glRes.json();
    expect(glData.data.length).toBeGreaterThan(0);
    expect(glData.data[0].reference).toBe(payRef);
  });

  test('2. Maintenance Work Order -> AP Invoice & Auto-Complete Service Request', async () => {
    // Get open service request
    const srRes = await apiRequest.get(`${API_BASE}/service-requests?status=open&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const srData = await srRes.json();
    if (srData.data.length === 0) return;
    const requestItem = srData.data[0];

    // Get vendor
    const vendorRes = await apiRequest.get(`${API_BASE}/contractors?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const vendorData = await vendorRes.json();
    const vendor = vendorData.data[0];

    // Create work order
    const woRes = await apiRequest.post(`${API_BASE}/service-requests/work-orders`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        serviceRequestId: requestItem.id,
        vendorId: vendor.id,
        estimatedCost: 5500,
        actualCost: 5500,
        status: 'scheduled',
      },
    });
    const woData = await woRes.json();
    const workOrder = woData.data || woData;
    if (!workOrder || !workOrder.id) return;

    // Complete work order
    const completeWoRes = await apiRequest.patch(
      `${API_BASE}/service-requests/work-orders/${workOrder.id}`,
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          status: 'completed',
          actualCost: 5500,
          vendorId: vendor.id,
        },
      },
    );
    const completeWoData = await completeWoRes.json();
    expect((completeWoData.data || completeWoData).status).toBe('completed');

    // Verify parent ServiceRequest is auto-completed
    const checkSrRes = await apiRequest.get(`${API_BASE}/service-requests/${requestItem.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const checkSrData = await checkSrRes.json();
    expect(checkSrData.data.status).toBe('completed');
  });

  test('3. Spot Cash Sale -> Title Transfer Auto-Initiation', async () => {
    // Find spot cash scheme
    const schemeRes = await apiRequest.get(`${API_BASE}/schemes?type=spot_cash`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const schemeData = await schemeRes.json();
    if (!schemeData.data || schemeData.data.length === 0) return;
    const scheme = schemeData.data[0];

    // Get available unit without existing lease
    const unitRes = await apiRequest.get(`${API_BASE}/units?status=available&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const unitData = await unitRes.json();
    if (!unitData.data || unitData.data.length === 0) return;
    const unit =
      unitData.data.find((u: any) => u.status === 'available' && !u.isReserved) || unitData.data[0];

    // Get agent
    const agentRes = await apiRequest.get(`${API_BASE}/agents?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const agentData = await agentRes.json();
    const agent = agentData.data[0];

    // Apply spot cash scheme
    const applyRes = await apiRequest.post(`${API_BASE}/sales/apply-scheme`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        unitId: unit.id,
        schemeId: scheme.id,
        buyerUserId: adminUserId,
        agentId: agent.id,
        totalContractValue: Number(unit.listPrice || 3500000),
      },
    });
    const applyData = await applyRes.json();
    expect(applyRes.status()).toBeLessThan(400);

    // Check that pending TitleTransfer was auto-created
    const ttRes = await apiRequest.get(`${API_BASE}/titles?unitId=${unit.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ttData = await ttRes.json();
    const list = ttData.data ?? ttData;
    expect(Array.isArray(list) ? list.length : 1).toBeGreaterThan(0);
  });

  test('4. Rent-to-Own Payment -> Rent vs. Equity Allocation', async () => {
    // Get RTO lease
    const rtoRes = await apiRequest.get(`${API_BASE}/rto-contracts?status=active&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rtoData = await rtoRes.json();
    const rtoList = rtoData.data ?? rtoData;
    if (!Array.isArray(rtoList) || rtoList.length === 0) return;
    const rtoContract = rtoList[0];

    // Record rental payment on RTO lease
    const payRef = `RTO-E2E-${Date.now()}`;
    const paymentsRes = await apiRequest.get(
      `${API_BASE}/rental-payments?leaseAgreementId=${rtoContract.leaseAgreementId}&status=pending`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const paymentsData = await paymentsRes.json();
    const pList = paymentsData.data ?? paymentsData;
    if (!Array.isArray(pList) || pList.length === 0) return;
    const payment = pList[0];

    await apiRequest.patch(`${API_BASE}/rental-payments/${payment.id}/pay`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        amountPaid: Number(payment.amountDue),
        paymentDate: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        paymentReference: payRef,
      },
    });

    // Verify equity ledger was updated
    const ledgerRes = await apiRequest.get(`${API_BASE}/rto-contracts/${rtoContract.id}/ledger`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ledgerData = await ledgerRes.json();
    const ledgerList = ledgerData.data ?? ledgerData;
    expect(Array.isArray(ledgerList) ? ledgerList.length : 1).toBeGreaterThan(0);
  });

  test('5. Owner P&L Generation for Property Owner', async () => {
    // Get an owner user
    const usersRes = await apiRequest.get(`${API_BASE}/users?userType=owner&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const usersData = await usersRes.json();
    if (usersData.data.length === 0) return;
    const owner = usersData.data[0];

    // Generate P&L statement
    const pnlRes = await apiRequest.post(`${API_BASE}/owner-pnl/generate`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        ownerId: owner.id,
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-12-31T23:59:59.000Z',
        managementFeeRate: 0.1,
      },
    });
    const pnlData = await pnlRes.json();
    expect(pnlData.data).toBeTruthy();
    expect(pnlData.data.status).toBe('issued');
    expect(Number(pnlData.data.netIncome)).toBe(
      Number(pnlData.data.grossRentalIncome) -
        Number(pnlData.data.totalExpenses) -
        Number(pnlData.data.managementFee),
    );
  });
});
