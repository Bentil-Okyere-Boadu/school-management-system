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
import { StudentGrade } from 'src/subject/student-grade.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { AttendanceService } from 'src/attendance/attendance.service';
import { Attendance } from 'src/attendance/attendance.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { EventCategory } from 'src/planner/entities/event-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      School,
      SchoolAdmin,
      Teacher,
      Student,
      Profile,
      Notification,
      StudentGrade,
      AcademicTerm,
      Attendance,
      AcademicCalendar,
      AcademicTerm,
      Holiday,
      ClassLevel,
      EventCategory,
    ]),
    InvitationModule,
  ],
  providers: [
    SchoolService,
    ProfileService,
    ObjectStorageServiceService,
    AttendanceService,
  ],
  controllers: [SchoolController],
  exports: [SchoolService],
})
export class SchoolModule {}
