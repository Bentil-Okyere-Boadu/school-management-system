import { Test, TestingModule } from '@nestjs/testing';
import { GradingSystemService } from './grading-system.service';

describe('GradingSystemService', () => {
  let service: GradingSystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GradingSystemService],
    }).compile();

    service = module.get<GradingSystemService>(GradingSystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
