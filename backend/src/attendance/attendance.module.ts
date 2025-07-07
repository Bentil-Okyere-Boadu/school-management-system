import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './attendance.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { Student } from 'src/student/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, ClassLevel, Student])],
  providers: [AttendanceService],
})
export class AttendanceModule {}
