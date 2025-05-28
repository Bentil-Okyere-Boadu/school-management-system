import { Test, TestingModule } from '@nestjs/testing';
import { ObjectStorageServiceService } from './object-storage-service.service';

describe('ObjectStorageServiceService', () => {
  let service: ObjectStorageServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObjectStorageServiceService],
    }).compile();

    service = module.get<ObjectStorageServiceService>(ObjectStorageServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
