import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassLevel } from './class-level.entity';
import { ClassLevelService } from './class-level.service';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';
import { ClassLevelController } from './class-level.controller';
import { ClassLevelResultApproval } from './class-level-result-approval.entity';
import { AcademicCalendarService } from 'src/academic-calendar/academic-calendar.service';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { School } from 'src/school/school.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassLevel,
      ClassLevelResultApproval,
      Teacher,
      Student,
      AcademicTerm,
      AcademicCalendar,
      Holiday,
      School,
      ClassLevelResultApproval,
    ]),
  ],
  providers: [ClassLevelService, AcademicCalendarService],
  exports: [ClassLevelService],
  controllers: [ClassLevelController],
})
export class ClassLevelModule {}
