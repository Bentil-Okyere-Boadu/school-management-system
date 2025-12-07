import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { Profile } from './profile.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SchoolAdminService } from 'src/school-admin/school-admin.service';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';
import { SuperAdminService } from 'src/super-admin/super-admin.service';
import { Student } from 'src/student/student.entity';
import { StudentService } from 'src/student/student.service';
import { Teacher } from 'src/teacher/teacher.entity';
import { TeacherService } from 'src/teacher/teacher.service';
import { School } from 'src/school/school.entity';
import { InvitationService } from 'src/invitation/invitation.service';
import { Role } from 'src/role/role.entity';
import { AttendanceService } from 'src/attendance/attendance.service';
import { Attendance } from 'src/attendance/attendance.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { StudentGrade } from 'src/subject/student-grade.entity';
import { AcademicCalendarService } from 'src/academic-calendar/academic-calendar.service';
import { Assignment } from 'src/teacher/entities/assignment.entity';
import { AssignmentSubmission } from 'src/student/entities/assignment-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      School,
      SchoolAdmin,
      SuperAdmin,
      Student,
      Teacher,
      Role,
      Attendance,
      ClassLevel,
      Holiday,
      AcademicTerm,
      AcademicCalendar,
      StudentGrade,
      Assignment,
      AssignmentSubmission,
    ]),
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    AttendanceService,
    ObjectStorageServiceService,
    SchoolAdminService,
    SuperAdminService,
    StudentService,
    TeacherService,
    InvitationService,
    AcademicCalendarService,
  ],
})
export class ProfileModule {}
