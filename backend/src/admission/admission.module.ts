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
import { Student } from 'src/student/student.entity';
import { Profile } from 'src/profile/profile.entity';
import { Role } from 'src/role/role.entity';
import { InvitationService } from 'src/invitation/invitation.service';
import { Teacher } from 'src/teacher/teacher.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Parent } from 'src/parent/parent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admission,
      Guardian,
      School,
      ClassLevel,
      PreviousSchoolResult,
      Student,
      Parent,
      Profile,
      Role,
      PreviousSchoolResult,
      Teacher,
      School,
      SchoolAdmin,
    ]),
  ],
  controllers: [AdmissionController],
  providers: [
    AdmissionService,
    ObjectStorageServiceService,
    EmailService,
    InvitationService,
  ],
})
export class AdmissionModule {}
