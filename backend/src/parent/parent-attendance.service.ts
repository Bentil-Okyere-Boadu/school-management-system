import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Attendance } from 'src/attendance/attendance.entity';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { Student } from 'src/student/student.entity';

export type ParentAttendanceDayStatus =
  | 'present'
  | 'absent'
  | 'none'
  | 'weekend'
  | 'holiday';

@Injectable()
export class ParentAttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Holiday)
    private readonly holidayRepository: Repository<Holiday>,
  ) {}

  async getMonthSheet(student: Student, year: number, month: number) {
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [records, holidayDates] = await Promise.all([
      this.attendanceRepository.find({
        where: {
          student: { id: student.id },
          date: Between(startDate, endDate),
        },
      }),
      this.getHolidayDates(student.school?.id, startDate, endDate),
    ]);

    const byDate = new Map(records.map((row) => [row.date, row.status]));

    const days: {
      day: number;
      date: string;
      status: ParentAttendanceDayStatus;
    }[] = [];

    let presentCount = 0;
    let absentCount = 0;

    for (let day = 1; day <= lastDay; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = this.resolveDayStatus(date, byDate.get(date), holidayDates);
      days.push({ day, date, status });

      if (status === 'present') presentCount += 1;
      if (status === 'absent') absentCount += 1;
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

  private resolveDayStatus(
    date: string,
    recorded: string | undefined,
    holidayDates: Set<string>,
  ): ParentAttendanceDayStatus {
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 'weekend';
    }

    if (holidayDates.has(date)) {
      return 'holiday';
    }

    return recorded === 'present' || recorded === 'absent' ? recorded : 'none';
  }

  private async getHolidayDates(
    schoolId: string | undefined,
    startDate: string,
    endDate: string,
  ) {
    if (!schoolId) return new Set<string>();

    const holidays = await this.holidayRepository
      .createQueryBuilder('holiday')
      .innerJoin('holiday.term', 'term')
      .innerJoin('term.academicCalendar', 'calendar')
      .innerJoin('calendar.school', 'school')
      .where('school.id = :schoolId', { schoolId })
      .andWhere('holiday.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    return new Set(holidays.map((holiday) => String(holiday.date).slice(0, 10)));
  }
}
