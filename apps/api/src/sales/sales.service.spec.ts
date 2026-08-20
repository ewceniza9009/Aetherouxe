import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { CodeSequenceService } from '../code-sequence/code-sequence.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SalesService Full Scale E2E Test Suite', () => {
  let service: SalesService;
  let prisma: any;
  let codeSequence: any;

  const mockTenantId = 'tenant-123';
  const mockUnitId = 'unit-456';
  const mockPropertyId = 'prop-789';
  const mockBuyerId = 'buyer-001';
  const mockAgentId = 'agent-002';

  const mockUnit = {
    id: mockUnitId,
    unitNumber: 'Unit 101',
    propertyId: mockPropertyId,
    status: 'available',
    property: {
      id: mockPropertyId,
      propertyCode: 'PROP-101',
      tenantId: mockTenantId,
      status: 'available',
    },
  };

  const mockBuyer = {
    id: mockBuyerId,
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'juan@example.com',
  };

  const mockAgent = {
    id: mockAgentId,
    userId: 'user-agent-002',
    user: {
      firstName: 'Maria',
      lastName: 'Clara',
      email: 'maria@example.com',
    },
  };

  beforeEach(async () => {
    prisma = {
      unit: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      realEstateAgent: {
        findUnique: jest.fn(),
      },
      scheme: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      leaseAgreement: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      agentTransaction: {
        create: jest.fn(),
      },
      arInvoice: {
        create: jest.fn(),
      },
      titleTransfer: {
        create: jest.fn(),
      },
      rtoContract: {
        create: jest.fn(),
        update: jest.fn(),
      },
      rtoEquityLedger: {
        create: jest.fn(),
      },
      rtoScheduleItem: {
        createMany: jest.fn(),
      },
      mortgageScenario: {
        create: jest.fn(),
      },
      financialMapping: {
        findFirst: jest.fn(),
      },
      journalEntry: {
        create: jest.fn(),
      },
      property: {
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    codeSequence = {
      next: jest.fn().mockImplementation((type: string) => {
        if (type === 'ar_invoice') return Promise.resolve('INV-2026-0001');
        if (type === 'lease_agreement') return Promise.resolve('LSE-2026-0001');
        if (type === 'title_transfer') return Promise.resolve('TT-2026-0001');
        if (type === 'rto_contract') return Promise.resolve('RTO-2026-0001');
        return Promise.resolve('SEQ-001');
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: prisma },
        { provide: CodeSequenceService, useValue: codeSequence },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  describe('Validation & Error Scenarios', () => {
    it('should throw NotFoundException if unit does not exist', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(
        service.applyScheme({
          unitId: 'non-existent',
          buyerUserId: mockBuyerId,
          agentId: mockAgentId,
          schemeId: 'scheme-1',
          totalContractValue: 5000000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if unit is not linked to a property', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: 'unit-orphan', propertyId: null });

      await expect(
        service.applyScheme({
          unitId: 'unit-orphan',
          buyerUserId: mockBuyerId,
          agentId: mockAgentId,
          schemeId: 'scheme-1',
          totalContractValue: 5000000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if buyer does not exist', async () => {
      prisma.unit.findUnique.mockResolvedValue(mockUnit);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.applyScheme({
          unitId: mockUnitId,
          buyerUserId: 'non-existent-buyer',
          agentId: mockAgentId,
          schemeId: 'scheme-1',
          totalContractValue: 5000000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if agent does not exist', async () => {
      prisma.unit.findUnique.mockResolvedValue(mockUnit);
      prisma.user.findUnique.mockResolvedValue(mockBuyer);
      prisma.realEstateAgent.findUnique.mockResolvedValue(null);

      await expect(
        service.applyScheme({
          unitId: mockUnitId,
          buyerUserId: mockBuyerId,
          agentId: 'non-existent-agent',
          schemeId: 'scheme-1',
          totalContractValue: 5000000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if scheme template does not exist', async () => {
      prisma.unit.findUnique.mockResolvedValue(mockUnit);
      prisma.user.findUnique.mockResolvedValue(mockBuyer);
      prisma.realEstateAgent.findUnique.mockResolvedValue(mockAgent);
      prisma.scheme.findUnique.mockResolvedValue(null);

      await expect(
        service.applyScheme({
          unitId: mockUnitId,
          buyerUserId: mockBuyerId,
          agentId: mockAgentId,
          schemeId: 'non-existent-scheme',
          totalContractValue: 5000000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if scheme template is inactive', async () => {
      prisma.unit.findUnique.mockResolvedValue(mockUnit);
      prisma.user.findUnique.mockResolvedValue(mockBuyer);
      prisma.realEstateAgent.findUnique.mockResolvedValue(mockAgent);
      prisma.scheme.findUnique.mockResolvedValue({ id: 'scheme-inactive', isActive: false });

      await expect(
        service.applyScheme({
          unitId: mockUnitId,
          buyerUserId: mockBuyerId,
          agentId: mockAgentId,
          schemeId: 'scheme-inactive',
          totalContractValue: 5000000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if contract value is missing for sales schemes', async () => {
      prisma.unit.findUnique.mockResolvedValue(mockUnit);
      prisma.user.findUnique.mockResolvedValue(mockBuyer);
      prisma.realEstateAgent.findUnique.mockResolvedValue(mockAgent);
      prisma.scheme.findUnique.mockResolvedValue({
        id: 'scheme-spot',
        schemeType: 'spot_cash',
        isActive: true,
      });

      await expect(
        service.applyScheme({
          unitId: mockUnitId,
          buyerUserId: mockBuyerId,
          agentId: mockAgentId,
          schemeId: 'scheme-spot',
          totalContractValue: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if active lease already exists for buyer on unit', async () => {
      prisma.unit.findUnique.mockResolvedValue(mockUnit);
      prisma.user.findUnique.mockResolvedValue(mockBuyer);
      prisma.realEstateAgent.findUnique.mockResolvedValue(mockAgent);
      prisma.scheme.findUnique.mockResolvedValue({
        id: 'scheme-spot',
        schemeType: 'spot_cash',
        isActive: true,
      });
      prisma.leaseAgreement.findFirst.mockResolvedValue({ id: 'existing-lease', isActive: true });

      await expect(
        service.applyScheme({
          unitId: mockUnitId,
          buyerUserId: mockBuyerId,
          agentId: mockAgentId,
          schemeId: 'scheme-spot',
          totalContractValue: 5000000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Spot Cash Sales Scheme Flow', () => {
    it('should execute end-to-end spot cash application, creating invoice, lease, title transfer, and commission', async () => {
      const mockScheme = {
        id: 'scheme-spot-1',
        name: 'Spot Cash 10% Discount',
        code: 'SCH-SPOT-10',
        schemeType: 'spot_cash',
        isActive: true,
        discountPercent: 10,
        companyCommissionPercentage: 5,
        assignedAgents: [{ agentId: mockAgentId, commissionPercentage: 5 }],
      };

      const mockCreatedLease = { id: 'lease-spot-001' };
      const mockCreatedInvoice = {
        id: 'inv-spot-001',
        invoiceNumber: 'INV-2026-0001',
        amount: 4500000,
      };
      const mockCreatedTitle = { id: 'title-spot-001', transferNumber: 'TT-2026-0001' };
      const mockCreatedAgentTx = { id: 'agent-tx-001', calculatedCommission: 250000 };

      prisma.unit.findUnique.mockResolvedValue(mockUnit);
      prisma.user.findUnique.mockResolvedValue(mockBuyer);
      prisma.realEstateAgent.findUnique.mockResolvedValue(mockAgent);
      prisma.scheme.findUnique.mockResolvedValue(mockScheme);
      prisma.leaseAgreement.findFirst.mockResolvedValue(null);

      prisma.leaseAgreement.create.mockResolvedValue(mockCreatedLease);
      prisma.arInvoice.create.mockResolvedValue(mockCreatedInvoice);
      prisma.titleTransfer.create.mockResolvedValue(mockCreatedTitle);
      prisma.agentTransaction.create.mockResolvedValue(mockCreatedAgentTx);
      prisma.financialMapping.findFirst.mockResolvedValue(null);
      prisma.unit.update.mockResolvedValue({ ...mockUnit, status: 'sold' });
      prisma.property.update.mockResolvedValue({ ...mockUnit.property, status: 'sold' });

      const result = await service.applyScheme({
        unitId: mockUnitId,
        buyerUserId: mockBuyerId,
        agentId: mockAgentId,
        schemeId: mockScheme.id,
        totalContractValue: 5000000,
      });

      expect(result).toBeDefined();
      expect(result.schemeType).toBe('spot_cash');
      expect(result.leaseId).toBe(mockCreatedLease.id);
      expect(result.invoice).toBeDefined();
      expect(result.invoice.amount).toBe(4500000); // 5M - 10% discount
      expect(result.discount.percent).toBe(10);
      expect(prisma.titleTransfer.create).toHaveBeenCalled();
      expect(prisma.agentTransaction.create).toHaveBeenCalled();
      expect(prisma.unit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUnitId },
          data: { status: 'sold' },
        }),
      );
    });
  });

  describe('Installment / Deferred Cash Scheme Flow', () => {
    it('should generate down payment and scheduled amortization invoices with commission', async () => {
      const mockScheme = {
        id: 'scheme-inst-1',
        name: 'In-House 20/80 2-Year Installment',
        code: 'SCH-INST-20-80',
        schemeType: 'installment',
        isActive: true,
        dpNumberOfPayments: 6,
        eqDownpaymentPercentage: 20,
        eqNumberOfPayments: 18,
        eqPaymentPercentage: 80,
        companyCommissionPercentage: 3,
        assignedAgents: [{ agentId: mockAgentId, commissionPercentage: 3 }],
      };

      prisma.unit.findUnique.mockResolvedValue(mockUnit);
      prisma.user.findUnique.mockResolvedValue(mockBuyer);
      prisma.realEstateAgent.findUnique.mockResolvedValue(mockAgent);
      prisma.scheme.findUnique.mockResolvedValue(mockScheme);
      prisma.leaseAgreement.findFirst.mockResolvedValue(null);

      prisma.leaseAgreement.create.mockResolvedValue({ id: 'lease-inst-001' });
      prisma.arInvoice.create.mockImplementation((args: any) => ({
        id: 'inv-' + Math.random(),
        invoiceNumber: 'INV-' + Math.random(),
        amount: args.data.amount,
        invoiceType: args.data.invoiceType,
        dueDate: args.data.dueDate,
      }));
      prisma.agentTransaction.create.mockResolvedValue({
        id: 'agent-tx-002',
        calculatedCommission: 90000,
      });
      prisma.financialMapping.findFirst.mockResolvedValue(null);
      prisma.unit.update.mockResolvedValue({ ...mockUnit, status: 'occupied' });
      prisma.property.update.mockResolvedValue({ ...mockUnit.property, status: 'under_contract' });

      const result = await service.applyScheme({
        unitId: mockUnitId,
        buyerUserId: mockBuyerId,
        agentId: mockAgentId,
        schemeId: mockScheme.id,
        totalContractValue: 3000000,
      });

      expect(result).toBeDefined();
      expect(result.schemeType).toBe('installment');
      expect(result.invoices).toBeDefined();
      expect(result.invoices.length).toBeGreaterThanOrEqual(6);
      expect(prisma.leaseAgreement.create).toHaveBeenCalled();
      expect(prisma.agentTransaction.create).toHaveBeenCalled();
    });
  });

  describe('Rent-To-Own (RTO) Scheme Flow', () => {
    it('should generate RTO contract with purchase credit calculation and initial option fee invoice', async () => {
      const mockScheme = {
        id: 'scheme-rto-1',
        name: 'RTO Premium 5-Year',
        code: 'SCH-RTO-5YR',
        schemeType: 'rent_to_own',
        isActive: true,
        optionFeePercent: 2,
        equityAccumulationPercent: 30,
        targetPurchaseYears: 5,
        companyCommissionPercentage: 2,
        assignedAgents: [{ agentId: mockAgentId, commissionPercentage: 2 }],
      };

      prisma.unit.findUnique.mockResolvedValue(mockUnit);
      prisma.user.findUnique.mockResolvedValue(mockBuyer);
      prisma.realEstateAgent.findUnique.mockResolvedValue(mockAgent);
      prisma.scheme.findUnique.mockResolvedValue(mockScheme);
      prisma.leaseAgreement.findFirst.mockResolvedValue(null);

      prisma.leaseAgreement.create.mockResolvedValue({ id: 'lease-rto-001' });
      prisma.rtoContract.create.mockResolvedValue({ id: 'rto-contract-001' });
      prisma.rtoEquityLedger.create.mockResolvedValue({ id: 'rto-ledger-001' });
      prisma.arInvoice.create.mockResolvedValue({
        id: 'inv-rto-001',
        invoiceNumber: 'INV-2026-0001',
        amount: 80000,
      });
      prisma.agentTransaction.create.mockResolvedValue({
        id: 'agent-tx-003',
        calculatedCommission: 80000,
      });
      prisma.financialMapping.findFirst.mockResolvedValue(null);
      prisma.unit.update.mockResolvedValue({ ...mockUnit, status: 'rto_active' });
      prisma.property.update.mockResolvedValue({ ...mockUnit.property, status: 'leased' });

      const result = await service.applyScheme({
        unitId: mockUnitId,
        buyerUserId: mockBuyerId,
        agentId: mockAgentId,
        schemeId: mockScheme.id,
        totalContractValue: 4000000,
        monthlyRentAmount: 30000,
      });

      expect(result).toBeDefined();
      expect(result.schemeType).toBe('rent_to_own');
      expect(result.rtoContractId).toBe('rto-contract-001');
      expect(result.rto).toBeDefined();
      expect(result.rto.equityAccumulationPercent).toBe(30);
      expect(result.rto.monthlyEquityPortion).toBe(9000); // 30% of 30,000
      expect(result.rto.monthlyRentPortion).toBe(21000); // 70% of 30,000
      expect(result.invoice.amount).toBe(80000); // 2% of 4,000,000 option fee
    });
  });

  describe('Standard Rental Scheme Flow', () => {
    it('should create active lease agreement without sales invoices', async () => {
      const mockScheme = {
        id: 'scheme-rent-1',
        name: 'Standard 1-Year Rental',
        code: 'SCH-RENT-1YR',
        schemeType: 'standard_rental',
        isActive: true,
        penaltyPercent: 5,
        graceDays: 3,
      };

      prisma.unit.findUnique.mockResolvedValue(mockUnit);
      prisma.user.findUnique.mockResolvedValue(mockBuyer);
      prisma.realEstateAgent.findUnique.mockResolvedValue(mockAgent);
      prisma.scheme.findUnique.mockResolvedValue(mockScheme);
      prisma.leaseAgreement.findFirst.mockResolvedValue(null);

      prisma.leaseAgreement.create.mockResolvedValue({ id: 'lease-rent-001' });
      prisma.financialMapping.findFirst.mockResolvedValue(null);
      prisma.unit.update.mockResolvedValue({ ...mockUnit, status: 'rented' });
      prisma.property.update.mockResolvedValue({ ...mockUnit.property, status: 'leased' });

      const result = await service.applyScheme({
        unitId: mockUnitId,
        buyerUserId: mockBuyerId,
        agentId: mockAgentId,
        schemeId: mockScheme.id,
        monthlyRentAmount: 25000,
      });

      expect(result).toBeDefined();
      expect(result.schemeType).toBe('standard_rental');
      expect(result.leaseId).toBe('lease-rent-001');
      expect(result.note).toContain('Lease created');
    });
  });

  describe('listSchemes Calculation Previews', () => {
    it('should list all active schemes applied to leases with metadata', async () => {
      const mockLeases = [
        {
          id: 'l1',
          schemeType: 'spot_cash',
          unitLabel: 'Unit 101',
          unitId: mockUnitId,
          propertyId: mockPropertyId,
          property: { propertyCode: 'PROP-101' },
          leaseType: 'purchase',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2027-01-01'),
          isActive: true,
          tenantUserId: mockBuyerId,
          tenant: { firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@example.com' },
          monthlyRentAmount: 0,
          agentId: mockAgentId,
          agent: { user: { firstName: 'Maria', lastName: 'Clara', email: 'maria@example.com' } },
          schemeId: 's1',
          scheme: {
            id: 's1',
            code: 'SCH-SPOT-10',
            name: 'Spot Cash 10%',
            companyCommissionPercentage: 5,
          },
          mortgageScenarios: [],
          rtoContract: null,
        },
        {
          id: 'l2',
          schemeType: 'rent_to_own',
          unitLabel: 'Unit 102',
          unitId: 'unit-102',
          propertyId: mockPropertyId,
          property: { propertyCode: 'PROP-101' },
          leaseType: 'rent_to_own',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2031-01-01'),
          isActive: true,
          tenantUserId: mockBuyerId,
          tenant: { firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@example.com' },
          monthlyRentAmount: 30000,
          agentId: mockAgentId,
          agent: { user: { firstName: 'Maria', lastName: 'Clara', email: 'maria@example.com' } },
          schemeId: 's2',
          scheme: {
            id: 's2',
            code: 'SCH-RTO-5YR',
            name: 'RTO 5Yr',
            companyCommissionPercentage: 3,
          },
          mortgageScenarios: [],
          rtoContract: { id: 'rto-1' },
        },
      ];

      prisma.leaseAgreement.findMany.mockResolvedValue(mockLeases);

      const list = await service.listSchemes();
      expect(list).toHaveLength(2);
      expect(list[0].schemeCode).toBe('SCH-SPOT-10');
      expect(list[0].schemeType).toBe('spot_cash');
      expect(list[1].schemeCode).toBe('SCH-RTO-5YR');
      expect(list[1].schemeType).toBe('rent_to_own');
    });
  });
});
