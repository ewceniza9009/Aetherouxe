import { GeneralLedgerService } from './general-ledger.service';

describe('GeneralLedgerService', () => {
  let service: GeneralLedgerService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {};
    service = new GeneralLedgerService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
