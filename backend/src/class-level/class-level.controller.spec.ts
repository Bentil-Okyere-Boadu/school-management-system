import { Test, TestingModule } from '@nestjs/testing';
import { ClassLevelController } from './class-level.controller';

describe('ClassLevelController', () => {
  let controller: ClassLevelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassLevelController],
    }).compile();

    controller = module.get<ClassLevelController>(ClassLevelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
