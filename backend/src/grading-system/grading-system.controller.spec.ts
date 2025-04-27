import { Test, TestingModule } from '@nestjs/testing';
import { GradingSystemController } from './grading-system.controller';

describe('GradingSystemController', () => {
  let controller: GradingSystemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradingSystemController],
    }).compile();

    controller = module.get<GradingSystemController>(GradingSystemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
