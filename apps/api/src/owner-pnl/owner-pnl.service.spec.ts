import { Test, TestingModule } from '@nestjs/testing';
import { OwnerPnlService } from './owner-pnl.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('OwnerPnlService', () => {
  let service: OwnerPnlService;
  let prisma: any;

  const mockOwner = {
    id: 'owner-uuid-1',
    firstName: 'Antonio',
    lastName: 'Reyes',
    email: 'owner1@elite-realty.com',
    phone: '+639171234567',
  };

  const mockProperties = [{ id: 'prop-1', ownerId: 'owner-uuid-1', propertyCode: 'PROP-HORIZON' }];

  const mockUnits = [
    {
      id: 'unit-1',
      unitNumber: 'Unit 12A',
      unitType: 'one_bedroom',
      status: 'occupied',
      propertyId: 'prop-1',
      listPrice: 5000000,
      floorNumber: '12',
      property: { propertyCode: 'PROP-HORIZON' },
      building: { name: 'Tower 1' },
      leaseAgreements: [
        {
          id: 'lease-1',
          monthlyRentAmount: 35000,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2027-01-01'),
          isActive: true,
          tenant: { firstName: 'Juan', lastName: 'Cruz' },
        },
      ],
    },
    {
      id: 'unit-2',
      unitNumber: 'Unit 14B',
      unitType: 'two_bedroom',
      status: 'available',
      propertyId: 'prop-1',
      listPrice: 7500000,
      floorNumber: '14',
      property: { propertyCode: 'PROP-HORIZON' },
      building: { name: 'Tower 1' },
      leaseAgreements: [],
    },
  ];

  const mockPnlStatements = [
    {
      id: 'pnl-1',
      periodStart: new Date('2026-06-01'),
      grossRentalIncome: 105000,
      totalExpenses: 15000,
      managementFee: 10500,
      netIncome: 79500,
      status: 'issued',
    },
  ];

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      property: {
        findMany: jest.fn(),
      },
      unit: {
        findMany: jest.fn(),
      },
      ownerPnlStatement: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OwnerPnlService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<OwnerPnlService>(OwnerPnlService);
  });

  it('should calculate accurate portfolio metrics, yields, and occupancy', async () => {
    prisma.user.findUnique.mockResolvedValue(mockOwner);
    prisma.property.findMany.mockResolvedValue(mockProperties);
    prisma.unit.findMany.mockResolvedValue(mockUnits);
    prisma.ownerPnlStatement.findMany.mockResolvedValue(mockPnlStatements);

    const summary = await service.getOwnerPortfolioSummary('owner-uuid-1');

    expect(summary).toBeDefined();
    expect(summary.owner.name).toBe('Antonio Reyes');
    expect(summary.metrics.totalUnits).toBe(2);
    expect(summary.metrics.occupiedUnits).toBe(1);
    expect(summary.metrics.occupancyRate).toBe(50);
    expect(summary.metrics.totalAssetValue).toBe(12500000); // 5M + 7.5M
    expect(summary.metrics.monthlyRentalIncome).toBe(35000);
    expect(summary.metrics.annualGrossRent).toBe(420000);
    expect(summary.metrics.grossYieldPct).toBe(3.36); // (420,000 / 12,500,000) * 100
    expect(summary.units.length).toBe(2);
    expect(summary.units[0].activeLease?.tenantName).toBe('Juan Cruz');
  });

  it('should throw NotFoundException if owner is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getOwnerPortfolioSummary('non-existent-owner')).rejects.toThrow(
      NotFoundException,
    );
  });
});
