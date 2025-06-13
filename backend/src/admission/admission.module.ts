import { Module } from '@nestjs/common';
import { AdmissionController } from './admission.controller';
import { AdmissionService } from './admission.service';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { Guardian } from './guardian.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admission } from './admission.entity';
import { School } from 'src/school/school.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { EmailService } from 'src/common/services/email.service';
import { PreviousSchoolResult } from './previous-school-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admission,
      Guardian,
      School,
      ClassLevel,
      PreviousSchoolResult,
    ]),
  ],
  controllers: [AdmissionController],
  providers: [AdmissionService, ObjectStorageServiceService, EmailService],
})
export class AdmissionModule {}
