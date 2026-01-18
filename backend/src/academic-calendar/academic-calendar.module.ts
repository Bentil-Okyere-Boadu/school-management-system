import { Module } from '@nestjs/common';
import { AcademicCalendarService } from './academic-calendar.service';
import { AcademicCalendarController } from './academic-calendar.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicCalendar } from './entitites/academic-calendar.entity';
import { AcademicTerm } from './entitites/academic-term.entity';
import { Holiday } from './entitites/holiday.entity';
import { School } from 'src/school/school.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AcademicCalendar, AcademicTerm, Holiday, School]),
  ],
  providers: [AcademicCalendarService],
  controllers: [AcademicCalendarController],
})
export class AcademicCalendarModule {}
