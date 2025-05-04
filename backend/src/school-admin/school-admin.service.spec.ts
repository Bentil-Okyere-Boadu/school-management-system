import { Test, TestingModule } from '@nestjs/testing';
import { SchoolAdminService } from './school-admin.service';

describe('SchoolAdminService', () => {
  let service: SchoolAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolAdminService],
    }).compile();

    service = module.get<SchoolAdminService>(SchoolAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
