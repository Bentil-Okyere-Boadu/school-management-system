import { Test, TestingModule } from '@nestjs/testing';
import { AdmissionPolicyService } from './admission-policy.service';

describe('AdmissionPolicyService', () => {
  let service: AdmissionPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdmissionPolicyService],
    }).compile();

    service = module.get<AdmissionPolicyService>(AdmissionPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
