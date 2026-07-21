import { ApInvoicesController } from './ap-invoices.controller';

describe('ApInvoicesController', () => {
  let controller: ApInvoicesController;
  let mockService: any;

  beforeEach(() => {
    mockService = {};
    controller = new ApInvoicesController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
