import { Test, TestingModule } from '@nestjs/testing';
import { ApInvoicesController } from './ap-invoices.controller';

describe('ApInvoicesController', () => {
  let controller: ApInvoicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApInvoicesController],
    }).compile();

    controller = module.get<ApInvoicesController>(ApInvoicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
