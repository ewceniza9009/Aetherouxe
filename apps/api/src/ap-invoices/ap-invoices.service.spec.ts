import { Test, TestingModule } from '@nestjs/testing';
import { ApInvoicesService } from './ap-invoices.service';

describe('ApInvoicesService', () => {
  let service: ApInvoicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApInvoicesService],
    }).compile();

    service = module.get<ApInvoicesService>(ApInvoicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
