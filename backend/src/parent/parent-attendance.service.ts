import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Attendance } from 'src/attendance/attendance.entity';
import { Student } from 'src/student/student.entity';

export type ParentAttendanceDayStatus = 'present' | 'absent' | 'none';

@Injectable()
export class ParentAttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  async getMonthSheet(student: Student, year: number, month: number) {
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const records = await this.attendanceRepository.find({
      where: {
        student: { id: student.id },
        date: Between(startDate, endDate),
      },
    });

    const byDate = new Map(records.map((row) => [row.date, row.status]));

    const days: {
      day: number;
      date: string;
      status: ParentAttendanceDayStatus;
    }[] = [];

    const presentCount = records.filter((row) => row.status === 'present').length;
    const absentCount = records.filter((row) => row.status === 'absent').length;

    for (let day = 1; day <= lastDay; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const recorded = byDate.get(date);
      const status: ParentAttendanceDayStatus =
        recorded === 'present' || recorded === 'absent' ? recorded : 'none';
      days.push({ day, date, status });
    }

    const daysRecorded = presentCount + absentCount;
    const attendanceRate =
      daysRecorded === 0
        ? 0
        : Math.round((presentCount / daysRecorded) * 100);

    const grade = student.classLevels?.[0]?.name ?? null;

    return {
      studentId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentCode: student.studentId,
      grade,
      photoUrl: student.profile?.avatarUrl ?? null,
      daysRecorded,
      presentCount,
      absentCount,
      attendanceRate,
      month,
      year,
      days,
    };
  }
}
