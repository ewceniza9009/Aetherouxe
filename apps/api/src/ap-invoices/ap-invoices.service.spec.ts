import { ApInvoicesService } from './ap-invoices.service';

describe('ApInvoicesService', () => {
  let service: ApInvoicesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {};
    service = new ApInvoicesService(mockPrisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
