import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

describe('SalesController', () => {
  let controller: SalesController;
  let service: any;

  beforeEach(async () => {
    service = {
      applyScheme: jest.fn(),
      listSchemes: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [{ provide: SalesService, useValue: service }],
    }).compile();

    controller = module.get<SalesController>(SalesController);
  });

  it('should delegate applyScheme to SalesService with request user id', async () => {
    const dto = {
      unitId: 'unit-1',
      buyerUserId: 'user-1',
      agentId: 'agent-1',
      schemeId: 'scheme-1',
      totalContractValue: 5000000,
    };
    const req = { user: { id: 'admin-user-id' } };
    const mockResult = { schemeType: 'spot_cash', leaseId: 'lease-1' };

    service.applyScheme.mockResolvedValue(mockResult);

    const result = await controller.applyScheme(dto as any, req);
    expect(service.applyScheme).toHaveBeenCalledWith(dto, 'admin-user-id');
    expect(result).toEqual(mockResult);
  });

  it('should delegate listSchemes to SalesService', async () => {
    const mockList = [{ id: 'scheme-1', name: 'Spot Cash' }];
    service.listSchemes.mockResolvedValue(mockList);

    const result = await controller.listSchemes();
    expect(service.listSchemes).toHaveBeenCalled();
    expect(result).toEqual(mockList);
  });
});
