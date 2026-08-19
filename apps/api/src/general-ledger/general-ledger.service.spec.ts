import { GeneralLedgerService } from './general-ledger.service';

describe('GeneralLedgerService', () => {
  let service: GeneralLedgerService;

  const mockPrismaService = {
    chartOfAccount: {
      findMany: jest.fn(),
    },
    journalEntry: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    journalLine: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(() => {
    service = new GeneralLedgerService(mockPrismaService as any);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compute balanced trial balance when total debits equal total credits', async () => {
    mockPrismaService.chartOfAccount.findMany.mockResolvedValue([
      {
        id: 'acc-1',
        accountCode: '1000',
        name: 'Operating Cash',
        type: 'asset',
        journalLines: [
          { debitAmount: 50000, creditAmount: 0 },
          { debitAmount: 25000, creditAmount: 0 },
        ],
      },
      {
        id: 'acc-2',
        accountCode: '4000',
        name: 'Rental Revenue',
        type: 'revenue',
        journalLines: [{ debitAmount: 0, creditAmount: 75000 }],
      },
    ]);

    const result = await service.getTrialBalance('tenant-1');

    expect(result).toBeDefined();
    expect(result.summary.totalDebits).toBe(75000);
    expect(result.summary.totalCredits).toBe(75000);
    expect(result.summary.difference).toBe(0);
    expect(result.summary.isBalanced).toBe(true);
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].netBalance).toBe(75000); // asset net debit
    expect(result.rows[1].netBalance).toBe(75000); // revenue net credit
  });

  it('should detect unbalanced ledger state if discrepancies exist', async () => {
    mockPrismaService.chartOfAccount.findMany.mockResolvedValue([
      {
        id: 'acc-1',
        accountCode: '1000',
        name: 'Operating Cash',
        type: 'asset',
        journalLines: [{ debitAmount: 50000, creditAmount: 0 }],
      },
      {
        id: 'acc-2',
        accountCode: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        journalLines: [{ debitAmount: 0, creditAmount: 48000 }],
      },
    ]);

    const result = await service.getTrialBalance('tenant-1');

    expect(result.summary.totalDebits).toBe(50000);
    expect(result.summary.totalCredits).toBe(48000);
    expect(result.summary.difference).toBe(2000);
    expect(result.summary.isBalanced).toBe(false);
  });
});
