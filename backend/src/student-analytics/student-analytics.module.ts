import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from 'src/student/student.entity';
import { AssignmentSubmission } from 'src/student/entities/assignment-submission.entity';
import { Subject } from 'src/subject/subject.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { StudentAnalyticsService } from './student-analytics.service';
import { StudentAnalyticsAdminController } from './student-analytics-admin.controller';
import { StudentAnalyticsTeacherController } from './student-analytics-teacher.controller';
import { StudentAnalyticsStudentController } from './student-analytics-student.controller';
import { StudentAnalyticsClassController } from './student-analytics-class.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      AssignmentSubmission,
      Subject,
      AcademicTerm,
      ClassLevel,
    ]),
  ],
  controllers: [
    StudentAnalyticsAdminController,
    StudentAnalyticsTeacherController,
    StudentAnalyticsStudentController,
    StudentAnalyticsClassController,
  ],
  providers: [StudentAnalyticsService],
})
export class StudentAnalyticsModule {}
