import { Test, TestingModule } from '@nestjs/testing';
import { GeneralLedgerService } from './general-ledger.service';

describe('GeneralLedgerService', () => {
  let service: GeneralLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneralLedgerService],
    }).compile();

    service = module.get<GeneralLedgerService>(GeneralLedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
