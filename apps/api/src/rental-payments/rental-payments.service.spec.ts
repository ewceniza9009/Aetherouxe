import { RentalPaymentsService } from './rental-payments.service';
import { NotFoundException } from '@nestjs/common';

describe('RentalPaymentsService', () => {
  let service: RentalPaymentsService;
  let mockPrisma: any;
  let mockRtoService: any;

  beforeEach(() => {
    mockPrisma = {
      leaseAgreement: {
        findUnique: jest.fn(),
      },
      rentalPayment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      chartOfAccount: {
        findFirst: jest.fn(),
      },
      journalEntry: {
        create: jest.fn(),
      },
    };

    mockRtoService = {
      recordPaymentAllocation: jest.fn(),
    };

    service = new RentalPaymentsService(mockPrisma as any, mockRtoService as any);
  });

  describe('recordPayment', () => {
    it('should update rental payment and post General Ledger entry when paid', async () => {
      const paymentId = 'pay-123';
      const existingPayment = {
        id: paymentId,
        leaseAgreementId: 'lease-456',
        amountDue: 15000,
        amountPaid: 0,
        dueDate: new Date(),
        lateFeeApplied: false,
      };

      const lease = {
        id: 'lease-456',
        leaseType: 'standard_rental',
        property: { tenantId: 'tenant-789' },
      };

      mockPrisma.rentalPayment.findUnique.mockResolvedValue(existingPayment);
      mockPrisma.leaseAgreement.findUnique.mockResolvedValue(lease);
      mockPrisma.rentalPayment.update.mockResolvedValue({
        ...existingPayment,
        amountPaid: 15000,
        status: 'paid',
      });

      mockPrisma.chartOfAccount.findFirst
        .mockResolvedValueOnce({ id: 'acc-1000' }) // cashAcc
        .mockResolvedValueOnce({ id: 'acc-4000' }); // rentAcc

      const result = await service.recordPayment(paymentId, {
        amountPaid: 15000,
        paymentDate: '2026-07-21T00:00:00.000Z',
        paymentMethod: 'bank_transfer',
        paymentReference: 'PAY-REF-123',
      });

      expect(mockPrisma.rentalPayment.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: expect.objectContaining({
          amountPaid: 15000,
          status: 'paid',
        }),
      });

      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-789',
          reference: 'PAY-REF-123',
          notes: expect.stringContaining('Rental payment recorded'),
          lines: {
            create: [
              { accountId: 'acc-1000', debitAmount: 15000, description: 'Cash received' },
              { accountId: 'acc-4000', creditAmount: 15000, description: 'Rental Income' },
            ],
          },
        },
      });

      expect(result.status).toBe('paid');
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      mockPrisma.rentalPayment.findUnique.mockResolvedValue(null);
      await expect(
        service.recordPayment('invalid-id', {
          amountPaid: 5000,
          paymentDate: '2026-07-21T00:00:00.000Z',
          paymentMethod: 'cash',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
