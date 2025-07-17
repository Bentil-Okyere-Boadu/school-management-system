import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from './attendance.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { Student } from '../student/student.entity';
import { Holiday } from '../academic-calendar/entitites/holiday.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from '../academic-calendar/entitites/academic-calendar.entity';

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
  summaryOnly?: boolean;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
    @InjectRepository(AcademicTerm)
    private academicTermRepository: Repository<AcademicTerm>,
    @InjectRepository(AcademicCalendar)
    private academicCalendarRepository: Repository<AcademicCalendar>,
  ) {}

  async getClassAttendance(filter: AttendanceFilter) {
    // Default to current month/year if filterType is 'month' and not provided
    if (filter.filterType === 'month') {
      const now = new Date();
      if (!filter.year) {
        filter.year = now.getFullYear();
      }
      if (!filter.month) {
        filter.month = now.getMonth() + 1; // JS months are 0-based
      }
    }

    const classLevel = await this.classLevelRepository.findOne({
      where: { id: filter.classLevelId },
      relations: ['students', 'school'],
    });
    if (!classLevel) throw new NotFoundException('Class not found');

    /* ───────────── date range & records ───────────── */
    const dateRange = this.getDateRange(filter);

    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        classLevel: { id: filter.classLevelId },
        date: Between(dateRange.startDate, dateRange.endDate),
      },
      relations: ['student'],
      order: { date: 'ASC' },
    });

    /* ───────────── get holidays for the school ───────────── */
    const holidays = await this.holidayRepository
      .createQueryBuilder('holiday')
      .innerJoin('holiday.term', 'term')
      .innerJoin('term.academicCalendar', 'calendar')
      .innerJoin('calendar.school', 'school')
      .where('school.id = :schoolId', { schoolId: classLevel.school.id })
      .andWhere('holiday.date BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      .getMany();

    const holidayDates = new Set(holidays.map((h) => h.date));

    const uniqueDates = this.generateDateRange(
      dateRange.startDate,
      dateRange.endDate,
    );
    const todayStr = new Date().toISOString().split('T')[0];

    // Only count valid school days (not weekends or holidays)
    const validSchoolDays = uniqueDates.filter((date) => {
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return false;
      if (holidayDates.has(date)) return false;
      return true;
    });

    /* ───────────── build lookup map ───────────── */
    const attendanceMap: Map<string, Map<string, string>> = new Map();
    attendanceRecords.forEach((rec) => {
      if (!attendanceMap.has(rec.student.id)) {
        attendanceMap.set(rec.student.id, new Map());
      }
      attendanceMap.get(rec.student.id)!.set(rec.date, rec.status);
    });

    /* ───────────── full detailed students ───────────── */
    const detailedStudents = classLevel.students.map((student) => {
      const studentAttendance =
        attendanceMap.get(student.id) ?? new Map<string, string>();

      const attendanceByDate = uniqueDates.reduce(
        (acc, date) => {
          // Check if it's a weekend
          const dayOfWeek = new Date(date).getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            acc[date] = 'weekend';
            return acc;
          }

          // Check if it's a holiday
          if (holidayDates.has(date)) {
            acc[date] = 'holiday';
            return acc;
          }

          const rawStatus = studentAttendance.get(date);
          const status =
            rawStatus === 'present' || rawStatus === 'absent'
              ? rawStatus
              : 'present';
          acc[date] = date > todayStr ? null : status;
          return acc;
        },
        {} as Record<
          string,
          'present' | 'absent' | 'holiday' | 'weekend' | null
        >,
      );

      const relevantStatuses = validSchoolDays
        .filter((date) => date <= todayStr)
        .map((date) => attendanceByDate[date]);

      const presentCount = relevantStatuses.filter(
        (s) => s === 'present',
      ).length;
      const absentCount = relevantStatuses.filter((s) => s === 'absent').length;
      const totalMarkedDays = presentCount + absentCount;
      const totalDaysInRange = validSchoolDays.filter(
        (date) => date <= todayStr,
      ).length;

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
          totalDaysInRange,
          presentPercentage:
            totalDaysInRange > 0
              ? Math.round((presentCount / totalDaysInRange) * 100)
              : 0,
          absentPercentage:
            totalDaysInRange > 0
              ? Math.round((absentCount / totalDaysInRange) * 100)
              : 0,
        },
      };
    });

    /* ───────────── if summaryOnly = true, strip down ───────────── */
    const students = filter.summaryOnly
      ? detailedStudents.map(
          ({ id, firstName, lastName, fullName, statistics }) => ({
            id,
            firstName,
            lastName,
            fullName,
            statistics,
          }),
        )
      : detailedStudents;

    // ───────────── summary for all students ─────────────
    const summaryStats = students.reduce(
      (acc, s) => {
        acc.totalMarkedDays += s.statistics.totalMarkedDays;
        acc.presentCount += s.statistics.presentCount;
        acc.absentCount += s.statistics.absentCount;
        acc.totalDaysInRange += s.statistics.totalDaysInRange;
        return acc;
      },
      {
        totalMarkedDays: 0,
        presentCount: 0,
        absentCount: 0,
        totalDaysInRange: 0,
      },
    );
    const averageAttendanceRate =
      summaryStats.totalDaysInRange > 0
        ? Math.round(
            (summaryStats.presentCount / summaryStats.totalDaysInRange) * 100,
          )
        : 0;
    const summary = {
      totalAttendanceCount: summaryStats.totalMarkedDays,
      totalPresentCount: summaryStats.presentCount,
      totalAbsentCount: summaryStats.absentCount,
      averageAttendanceRate,
    };

    /* ───────────── return based on summary flag ───────────── */
    return filter.summaryOnly
      ? {
          classLevel: { id: classLevel.id, name: classLevel.name },
          students,
          summary,
        }
      : {
          classLevel: { id: classLevel.id, name: classLevel.name },
          dateRange: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            dates: uniqueDates,
          },
          students,
          summary,
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
    if (
      (filter.filterType === 'week' || filter.filterType === 'month') &&
      (!filter.month || !filter.year)
    ) {
      if (!filter.year) filter.year = today.getFullYear();
      if (!filter.month) filter.month = today.getMonth() + 1;
    }

    switch (filter.filterType) {
      case 'day':
        if (!filter.date) throw new Error('Date is required for day filter');
        startDate = new Date(filter.date);
        endDate = new Date(filter.date);
        break;

      case 'week':
        if (filter.month && filter.weekOfMonth) {
          // ───── week N INSIDE a specific month ─────
          const year = filter.year ?? today.getFullYear();
          const month = filter.month - 1; // 0‑based
          const week = filter.weekOfMonth; // 1‑based

          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const startDay = 1 + (week - 1) * 7;
          if (startDay > daysInMonth) {
            throw new Error(
              'weekOfMonth exceeds number of weeks in this month',
            );
          }

          startDate = new Date(year, month, startDay);
          endDate = new Date(year, month, Math.min(startDay + 6, daysInMonth));
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

      case 'month': {
        const yearForMonth = filter.year ?? today.getFullYear();
        const month = (filter.month ?? today.getMonth() + 1) - 1;
        startDate = new Date(yearForMonth, month, 1);
        endDate = new Date(yearForMonth, month + 1, 0);
        break;
      }

      case 'year': {
        const year = filter.year ?? today.getFullYear();
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;
      }

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

  private async findAcademicTermForDate(
    schoolId: string,
    date: string,
  ): Promise<{ term: AcademicTerm; calendar: AcademicCalendar } | null> {
    const term = await this.academicTermRepository
      .createQueryBuilder('term')
      .innerJoin('term.academicCalendar', 'calendar')
      .innerJoin('calendar.school', 'school')
      .where('school.id = :schoolId', { schoolId })
      .andWhere('term.startDate <= :date', { date })
      .andWhere('term.endDate >= :date', { date })
      .getOne();

    if (!term) {
      return null;
    }

    return {
      term,
      calendar: term.academicCalendar,
    };
  }

  async getClassAttendanceForDay(classLevelId: string, date: string) {
    return this.getClassAttendance({
      classLevelId,
      filterType: 'day',
      date,
    });
  }

  async getClassAttendanceByTerm(classLevelId: string, academicTermId: string) {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['students', 'school'],
    });
    if (!classLevel) throw new NotFoundException('Class not found');

    const term = await this.academicTermRepository.findOne({
      where: { id: academicTermId },
      relations: ['academicCalendar', 'academicCalendar.school'],
    });
    if (!term) throw new NotFoundException('Academic term not found');

    // Verify the term belongs to the same school as the class
    if (term.academicCalendar.school.id !== classLevel.school.id) {
      throw new BadRequestException('Term does not belong to the same school');
    }

    return this.getClassAttendance({
      classLevelId,
      filterType: 'custom',
      startDate: term.startDate,
      endDate: term.endDate,
    });
  }

  async getClassAttendanceByAcademicYear(
    classLevelId: string,
    academicCalendarId: string,
  ) {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['students', 'school'],
    });
    if (!classLevel) throw new NotFoundException('Class not found');

    const calendar = await this.academicCalendarRepository.findOne({
      where: { id: academicCalendarId },
      relations: ['school', 'terms'],
    });
    if (!calendar) throw new NotFoundException('Academic calendar not found');

    // Verify the calendar belongs to the same school as the class
    if (calendar.school.id !== classLevel.school.id) {
      throw new BadRequestException(
        'Calendar does not belong to the same school',
      );
    }

    // Find the earliest start date and latest end date from all terms
    const startDate = calendar.terms.reduce(
      (earliest, term) =>
        term.startDate < earliest ? term.startDate : earliest,
      calendar.terms[0]?.startDate || new Date().toISOString().split('T')[0],
    );

    const endDate = calendar.terms.reduce(
      (latest, term) => (term.endDate > latest ? term.endDate : latest),
      calendar.terms[0]?.endDate || new Date().toISOString().split('T')[0],
    );

    return this.getClassAttendance({
      classLevelId,
      filterType: 'custom',
      startDate,
      endDate,
    });
  }

  async markAttendance(
    classLevelId: string,
    date: string,
    records: { studentId: string; status: 'present' | 'absent' }[],
  ) {
    // Check if the date is a weekend
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw new BadRequestException('Cannot mark attendance on weekends');
    }

    // Check if the date is a holiday
    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['school'],
    });
    if (!classLevel) throw new NotFoundException('Class not found');

    const isHoliday = await this.holidayRepository
      .createQueryBuilder('holiday')
      .innerJoin('holiday.term', 'term')
      .innerJoin('term.academicCalendar', 'calendar')
      .innerJoin('calendar.school', 'school')
      .where('school.id = :schoolId', { schoolId: classLevel.school.id })
      .andWhere('holiday.date = :date', { date })
      .getExists();

    if (isHoliday) {
      throw new BadRequestException('Cannot mark attendance on a holiday');
    }

    // Find the academic term for this date
    const academicInfo = await this.findAcademicTermForDate(
      classLevel.school.id,
      date,
    );

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
          academicTerm: academicInfo?.term || undefined,
          academicCalendar: academicInfo?.calendar || undefined,
        });
      } else {
        attendance.status = record.status;
        // Update academic term/calendar if not set
        if (!attendance.academicTerm && academicInfo?.term) {
          attendance.academicTerm = academicInfo.term;
          attendance.academicCalendar = academicInfo.calendar;
        }
      }
      await this.attendanceRepository.save(attendance);
    }
    return { message: 'Attendance marked successfully' };
  }

  async getClassAttendanceSummary(
    classLevelId: string,
    filter?: AttendanceFilter,
  ) {
    // Use the same filter logic as getClassAttendance, but always summaryOnly
    const summary = await this.getClassAttendance({
      classLevelId,
      filterType: filter?.filterType || 'year', // or whatever default you want
      year: filter?.year,
      month: filter?.month,
      week: filter?.week,
      weekOfMonth: filter?.weekOfMonth,
      date: filter?.date,
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      summaryOnly: true,
    });

    // Aggregate statistics from all students
    const stats = summary.students.reduce(
      (acc, s) => {
        acc.totalMarkedDays += s.statistics.totalMarkedDays;
        acc.presentCount += s.statistics.presentCount;
        acc.absentCount += s.statistics.absentCount;
        acc.totalDaysInRange += s.statistics.totalDaysInRange;
        return acc;
      },
      {
        totalMarkedDays: 0,
        presentCount: 0,
        absentCount: 0,
        totalDaysInRange: 0,
      },
    );

    const averageAttendanceRate =
      stats.totalDaysInRange > 0
        ? Math.round((stats.presentCount / stats.totalDaysInRange) * 100)
        : 0;

    return {
      totalAttendanceCount: stats.totalMarkedDays,
      totalPresentCount: stats.presentCount,
      totalAbsentCount: stats.absentCount,
      averageAttendanceRate,
    };
  }

  async getStudentAttendance(
    classLevelId: string,
    studentId: string,
    filter: AttendanceFilter,
  ) {
    // Always use summaryOnly: false to get full attendance details
    const classAttendance = await this.getClassAttendance({
      ...filter,
      classLevelId,
      summaryOnly: filter.summaryOnly,
    });

    // Find the student in the result
    const student = classAttendance.students.find((s) => s.id === studentId);

    if (!student) {
      throw new NotFoundException(
        'Student not found in this class or date range',
      );
    }

    // Optionally, return class info and date range for context
    return {
      classLevel: classAttendance.classLevel,
      dateRange: classAttendance.dateRange,
      student,
    };
  }
}
