import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionPolicy } from './admission-policy.entity';
import { AdmissionPolicyService } from './admission-policy.service';
import { AdmissionPolicyController } from './admission-policy.controller';
import { ObjectStorageServiceModule } from 'src/object-storage-service/object-storage-service.module';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdmissionPolicy]),
    ObjectStorageServiceModule,
  ],
  controllers: [AdmissionPolicyController],
  providers: [AdmissionPolicyService, ObjectStorageServiceService],
  exports: [AdmissionPolicyService],
})
export class AdmissionPolicyModule {}
