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
      GradingSystem,
      Holiday,
    ]),
  ],
  providers: [SubjectService, AcademicCalendarService],
  controllers: [SubjectController, SubjectCatalogController],
  exports: [TypeOrmModule],
})
export class SubjectModule {}
