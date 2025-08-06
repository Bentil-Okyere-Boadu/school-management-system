import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './attendance.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { Student } from 'src/student/student.entity';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, ClassLevel, Student, Holiday, AcademicTerm, AcademicCalendar])],
  providers: [AttendanceService],
})
export class AttendanceModule {}
