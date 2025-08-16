import { Student } from 'src/student/student.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './school.entity';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { InvitationModule } from 'src/invitation/invitation.module';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { ProfileService } from 'src/profile/profile.service';
import { Profile } from 'src/profile/profile.entity';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { Notification } from 'src/notification/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      School,
      SchoolAdmin,
      Teacher,
      Student,
      Profile,
      Notification,
    ]),
    InvitationModule,
  ],
  providers: [SchoolService, ProfileService, ObjectStorageServiceService],
  controllers: [SchoolController],
  exports: [SchoolService],
})
export class SchoolModule {}
