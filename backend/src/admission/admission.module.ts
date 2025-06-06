import { Module } from '@nestjs/common';
import { AdmissionController } from './admission.controller';
import { AdmissionService } from './admission.service';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { Guardian } from './guardian.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admission } from './admission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admission, Guardian])],
  controllers: [AdmissionController],
  providers: [AdmissionService, ObjectStorageServiceService],
})
export class AdmissionModule {}
