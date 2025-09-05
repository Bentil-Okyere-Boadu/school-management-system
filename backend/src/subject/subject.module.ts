import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';
import { Subject } from './subject.entity';
import { Teacher } from '../teacher/teacher.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { SubjectCatalog } from './subject-catalog.entity';
import { SubjectCatalogController } from './subject-catalog.controller';
import { School } from 'src/school/school.entity';
import { StudentGrade } from './student-grade.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { Student } from 'src/student/student.entity';
import { GradingSystem } from 'src/grading-system/grading-system.entity';
import { AcademicCalendarService } from 'src/academic-calendar/academic-calendar.service';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { StudentTermRemark } from './student-term-remark.entity';
import { TeacherService } from 'src/teacher/teacher.service';
import { InvitationService } from 'src/invitation/invitation.service';
import { EmailService } from 'src/common/services/email.service';
import { ProfileService } from 'src/profile/profile.service';
import { Role } from 'src/role/role.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Profile } from 'src/profile/profile.entity';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { ClassLevelResultApproval } from 'src/class-level/class-level-result-approval.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subject,
      Teacher,
      ClassLevel,
      SubjectCatalog,
      School,
      StudentGrade,
      AcademicCalendar,
      AcademicTerm,
      Student,
      Role,
      SchoolAdmin,
      Profile,
      GradingSystem,
      Holiday,
      StudentTermRemark,
      ClassLevelResultApproval,
    ]),
  ],
  providers: [
    SubjectService,
    AcademicCalendarService,
    TeacherService,
    InvitationService,
    EmailService,
    ProfileService,
    ObjectStorageServiceService,
  ],
  controllers: [SubjectController, SubjectCatalogController],
  exports: [TypeOrmModule],
})
export class SubjectModule {}
