import { GeneralLedgerController } from './general-ledger.controller';

describe('GeneralLedgerController', () => {
  let controller: GeneralLedgerController;
  let mockService: any;

  beforeEach(() => {
    mockService = {};
    controller = new GeneralLedgerController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
