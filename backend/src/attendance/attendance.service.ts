import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from './attendance.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { Student } from '../student/student.entity';

export interface AttendanceFilter {
  classLevelId: string;
  filterType: 'day' | 'week' | 'month' | 'year' | 'custom';
  date?: string; // for single day
  startDate?: string; // for custom range
  endDate?: string; // for custom range
  year?: number; // for year filter
  month?: number; // for month filter (1-12)
  week?: number; // for week filter (week number of year)
  weekOfMonth?: number; // e.g. 2nd week in a given month
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async getClassAttendance(filter: AttendanceFilter) {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id: filter.classLevelId },
      relations: ['students'],
    });
    if (!classLevel) throw new NotFoundException('Class not found');

    /* ─────────────────────────────── date range & records ────────────────────────────── */
    const dateRange = this.getDateRange(filter);

    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        classLevel: { id: filter.classLevelId },
        date: Between(dateRange.startDate, dateRange.endDate),
      },
      relations: ['student'],
      order: { date: 'ASC' },
    });

    const uniqueDates = this.generateDateRange(
      dateRange.startDate,
      dateRange.endDate,
    );
    const todayStr = new Date().toISOString().split('T')[0];

    /* ─────────────────────────────── build look‑up map ──────────────────────────────── */
    const attendanceMap: Map<string, Map<string, string>> = new Map();
    attendanceRecords.forEach((rec) => {
      if (!attendanceMap.has(rec.student.id)) {
        attendanceMap.set(rec.student.id, new Map());
      }
      attendanceMap.get(rec.student.id)!.set(rec.date, rec.status);
    });

    /* ────────────────────────────── per‑student output ──────────────────────────────── */
    const studentsWithAttendance = classLevel.students.map((student) => {
      const studentAttendance =
        attendanceMap.get(student.id) ?? new Map<string, string>();

      // Build daily status object
      const attendanceByDate = uniqueDates.reduce(
        (acc, date) => {
          const rawStatus = studentAttendance.get(date);
          const status =
            rawStatus === 'present' || rawStatus === 'absent'
              ? rawStatus
              : 'present';

          acc[date] = date > todayStr ? null : status;
          return acc;
        },
        {} as Record<string, 'present' | 'absent' | null>,
      );

      /* ---------------- stats up to today only ---------------- */
      const relevantStatuses = Object.entries(attendanceByDate)
        .filter(([date, status]) => date <= todayStr && status !== null)
        .map(([, status]) => status);

      const presentCount = relevantStatuses.filter(
        (s) => s === 'present',
      ).length;
      const absentCount = relevantStatuses.filter((s) => s === 'absent').length;
      const totalMarkedDays = presentCount + absentCount;

      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`,
        attendanceByDate,
        statistics: {
          totalMarkedDays,
          presentCount,
          absentCount,
        },
      };
    });

    /* ─────────────────────────────────── response ──────────────────────────────────── */
    return {
      classLevel: { id: classLevel.id, name: classLevel.name },
      dateRange: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dates: uniqueDates,
      },
      students: studentsWithAttendance,
    };
  }

  private generateDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private getDateRange(filter: AttendanceFilter): {
    startDate: string;
    endDate: string;
  } {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (filter.filterType) {
      case 'day':
        if (!filter.date) throw new Error('Date is required for day filter');
        startDate = new Date(filter.date);
        endDate = new Date(filter.date);
        break;

      case 'week':
        if (filter.month && filter.weekOfMonth) {
          // Handle weekOfMonth + month + year
          const year = filter.year ?? today.getFullYear();
          const month = filter.month - 1; // 0-based index
          const firstDay = new Date(year, month, 1);
          const start = new Date(firstDay);
          start.setDate(1 + (filter.weekOfMonth - 1) * 7);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          startDate = start;
          endDate = end;
        } else if (filter.week && filter.year) {
          // Handle ISO week + year
          startDate = this.getDateOfWeek(filter.week, filter.year);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
        } else {
          // Default to current week
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
        }
        break;

      case 'month':
        const yearForMonth = filter.year ?? today.getFullYear();
        const month = (filter.month ?? today.getMonth() + 1) - 1;
        startDate = new Date(yearForMonth, month, 1);
        endDate = new Date(yearForMonth, month + 1, 0);
        break;

      case 'year':
        const year = filter.year ?? today.getFullYear();
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;

      case 'custom':
        if (!filter.startDate || !filter.endDate) {
          throw new Error(
            'Start date and end date are required for custom filter',
          );
        }
        startDate = new Date(filter.startDate);
        endDate = new Date(filter.endDate);
        break;

      default:
        throw new Error('Invalid filter type');
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }

  private getDateOfWeek(week: number, year: number): Date {
    const firstDay = new Date(year, 0, 1);
    const day = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = (week - 1) * 7 - (day > 0 ? day - 1 : 6);
    firstDay.setDate(firstDay.getDate() + diff);
    return firstDay;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async getClassAttendanceForDay(classLevelId: string, date: string) {
    return this.getClassAttendance({
      classLevelId,
      filterType: 'day',
      date,
    });
  }

  async markAttendance(
    classLevelId: string,
    date: string,
    records: { studentId: string; status: 'present' | 'absent' }[],
  ) {
    for (const record of records) {
      let attendance = await this.attendanceRepository.findOne({
        where: {
          classLevel: { id: classLevelId },
          student: { id: record.studentId },
          date,
        },
      });
      if (!attendance) {
        attendance = this.attendanceRepository.create({
          classLevel: { id: classLevelId } as ClassLevel,
          student: { id: record.studentId } as Student,
          date,
          status: record.status,
        });
      } else {
        attendance.status = record.status;
      }
      await this.attendanceRepository.save(attendance);
    }
    return { message: 'Attendance marked successfully' };
  }
}
