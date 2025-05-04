import { Test, TestingModule } from '@nestjs/testing';
import { SchoolAdminController } from './school-admin.controller';

describe('SchoolAdminController', () => {
  let controller: SchoolAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolAdminController],
    }).compile();

    controller = module.get<SchoolAdminController>(SchoolAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
