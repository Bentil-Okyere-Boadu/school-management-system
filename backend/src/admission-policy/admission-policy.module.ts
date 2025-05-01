import { Module } from '@nestjs/common';
import { AdmissionPolicyService } from './admission-policy.service';

@Module({
  providers: [AdmissionPolicyService],
})
export class AdmissionPolicyModule {}
