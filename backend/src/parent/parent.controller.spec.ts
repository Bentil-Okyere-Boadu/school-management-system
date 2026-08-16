import { Test, TestingModule } from '@nestjs/testing';
import { ParentController } from './parent.controller';
import { ParentAuthService } from './parent-auth.service';
import { ParentDashboardService } from './parent-dashboard.service';
import { ParentPaymentService } from './parent-payment.service';
import { ParentLinkService } from './parent-link.service';

describe('ParentController', () => {
  let controller: ParentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParentController],
      providers: [
        { provide: ParentAuthService, useValue: {} },
        { provide: ParentDashboardService, useValue: {} },
        { provide: ParentPaymentService, useValue: {} },
        { provide: ParentLinkService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ParentController>(ParentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
