import { RtoCreditScoreService } from './rto-credit-score.service';
import { NotFoundException } from '@nestjs/common';

describe('RtoCreditScoreService', () => {
  let service: RtoCreditScoreService;

  const mockPrismaService = {
    rtoContract: {
      findUnique: jest.fn(),
    },
    utilityBill: {
      findMany: jest.fn(),
    },
    arInvoice: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    service = new RtoCreditScoreService(mockPrismaService as any);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if RTO contract does not exist', async () => {
    mockPrismaService.rtoContract.findUnique.mockResolvedValue(null);

    await expect(service.calculateRtoScore('invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('should accurately compute high credit score for reliable payer with stable utilities', async () => {
    mockPrismaService.rtoContract.findUnique.mockResolvedValue({
      id: 'rto-1',
      accumulatedEquity: 500000,
      totalContractValue: 3000000,
      purchaseOptionPrice: 3000000,
      monthlyEquityPortion: 20000,
      leaseAgreement: {
        id: 'lease-1',
        propertyId: 'prop-1',
        tenant: {
          id: 'user-1',
          firstName: 'Erwin',
          lastName: 'Ceniza',
        },
        rentalPayments: [
          { status: 'paid', lateFeeApplied: false },
          { status: 'paid', lateFeeApplied: false },
          { status: 'paid', lateFeeApplied: false },
          { status: 'paid', lateFeeApplied: false },
        ],
      },
    });

    mockPrismaService.utilityBill.findMany.mockResolvedValue([
      { consumption: 20 },
      { consumption: 21 },
      { consumption: 19 },
      { consumption: 20 },
    ]);

    mockPrismaService.arInvoice.findMany.mockResolvedValue([]);

    const result = await service.calculateRtoScore('rto-1');

    expect(result).toBeDefined();
    expect(result.tenantName).toBe('Erwin Ceniza');
    expect(result.delinquencyRiskTier).toBe('LOW');
    expect(result.creditScore).toBeGreaterThanOrEqual(700);
    expect(result.conversionReadinessIndex).toBeGreaterThanOrEqual(80);
    expect(result.factors.paymentReliabilityScore).toBe(100);
    expect(result.factors.arDelinquencyScore).toBe(100);
    expect(result.aiRecommendations.length).toBeGreaterThan(0);
  });

  it('should flag elevated risk for tenant with late payments and open arrears', async () => {
    mockPrismaService.rtoContract.findUnique.mockResolvedValue({
      id: 'rto-2',
      accumulatedEquity: 20000,
      totalContractValue: 5000000,
      purchaseOptionPrice: 5000000,
      monthlyEquityPortion: 10000,
      leaseAgreement: {
        id: 'lease-2',
        propertyId: 'prop-2',
        tenant: {
          id: 'user-2',
          firstName: 'John',
          lastName: 'Doe',
        },
        rentalPayments: [
          { status: 'paid', lateFeeApplied: true },
          { status: 'pending', lateFeeApplied: true },
          { status: 'paid', lateFeeApplied: true },
        ],
      },
    });

    mockPrismaService.utilityBill.findMany.mockResolvedValue([
      { consumption: 5 },
      { consumption: 65 },
      { consumption: 10 },
    ]);

    mockPrismaService.arInvoice.findMany.mockResolvedValue([
      { amount: 35000, status: 'overdue' },
      { amount: 15000, status: 'overdue' },
    ]);

    const result = await service.calculateRtoScore('rto-2');

    expect(result).toBeDefined();
    expect(result.delinquencyRiskTier).toMatch(/HIGH|CRITICAL/);
    expect(result.creditScore).toBeLessThan(650);
    expect(result.metrics.outstandingArBalance).toBe(50000);
    expect(result.aiRecommendations.some((r) => r.includes('overdue'))).toBe(true);
  });
});
