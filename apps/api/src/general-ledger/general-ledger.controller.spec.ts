import { Test, TestingModule } from '@nestjs/testing';
import { GeneralLedgerController } from './general-ledger.controller';

describe('GeneralLedgerController', () => {
  let controller: GeneralLedgerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneralLedgerController],
    }).compile();

    controller = module.get<GeneralLedgerController>(GeneralLedgerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
