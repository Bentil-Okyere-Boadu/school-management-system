import { Module } from '@nestjs/common';
import { AdmissionPolicyService } from './admission-policy.service';
import { AdmissionPolicyController } from './admission-policy.controller';

@Module({
  providers: [AdmissionPolicyService],
  controllers: [AdmissionPolicyController],
})
export class AdmissionPolicyModule {}
