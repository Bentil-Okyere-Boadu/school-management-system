import { Test, TestingModule } from '@nestjs/testing';
import { AdmissionPolicyController } from './admission-policy.controller';

describe('AdmissionPolicyController', () => {
  let controller: AdmissionPolicyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdmissionPolicyController],
    }).compile();

    controller = module.get<AdmissionPolicyController>(AdmissionPolicyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
