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

    const dateRange = this.getDateRange(filter);

    // Get all attendance records for the date range
    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        classLevel: { id: filter.classLevelId },
        date: Between(dateRange.startDate, dateRange.endDate),
      },
      relations: ['student'],
      order: { date: 'ASC' },
    });

    // Ensure today is included in the date list
    const todayStr = new Date().toISOString().split('T')[0];

    const uniqueDates = [
      ...new Set([...attendanceRecords.map((record) => record.date), todayStr]),
    ].sort();

    // Create attendance map: studentId -> { date -> status }
    const attendanceMap: Map<string, Map<string, string>> = new Map();

    attendanceRecords.forEach((record) => {
      if (!attendanceMap.has(record.student.id)) {
        attendanceMap.set(record.student.id, new Map());
      }
      attendanceMap.get(record.student.id)!.set(record.date, record.status);
    });

    // Build response with students and their attendance for each date
    const studentsWithAttendance = classLevel.students.map((student) => {
      const studentAttendance: Map<string, string> =
        attendanceMap.get(student.id) ?? new Map();

      const attendanceByDate = uniqueDates.reduce(
        (acc, date) => {
          acc[date] = studentAttendance.get(date) ?? 'present'; // default to present
          return acc;
        },
        {} as Record<string, string>,
      );

      // Calculate attendance statistics
      const totalDays = uniqueDates.length;
      const presentDays = Object.values(attendanceByDate).filter(
        (status) => status === 'present',
      ).length;
      const absentDays = totalDays - presentDays;
      const attendancePercentage =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`,
        attendanceByDate,
        statistics: {
          totalDays,
          presentDays,
          absentDays,
          attendancePercentage,
        },
      };
    });

    return {
      classLevel: {
        id: classLevel.id,
        name: classLevel.name,
      },
      dateRange: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dates: uniqueDates,
      },
      students: studentsWithAttendance,
      // Uncomment if needed later
      // summary: {
      //   totalStudents: classLevel.students.length,
      //   totalDays: uniqueDates.length,
      //   overallAttendancePercentage: this.calculateOverallAttendancePercentage(
      //     studentsWithAttendance,
      //   ),
      // },
    };
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
        if (filter.week && filter.year) {
          // Get specific week of year
          startDate = this.getDateOfWeek(filter.week, filter.year);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6); // Add 6 days to get end of week
        } else {
          // Current week
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6); // End of current week (Saturday)
        }
        break;

      case 'month':
        if (filter.month && filter.year) {
          startDate = new Date(filter.year, filter.month - 1, 1);
          endDate = new Date(filter.year, filter.month, 0); // Last day of month
        } else {
          // Current month
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        break;

      case 'year': {
        const year = filter.year || today.getFullYear();
        startDate = new Date(year, 0, 1); // January 1st
        endDate = new Date(year, 11, 31); // December 31st
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
    const date = new Date(year, 0, 1);
    const dayOfWeek = date.getDay();
    const daysToAdd = (week - 1) * 7 - dayOfWeek;
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }

  // private calculateOverallAttendancePercentage(students: any[]): number {
  //   if (students.length === 0) return 100;

  //   const totalPercentage = students.reduce((sum, student) => {
  //     return sum + student.statistics.attendancePercentage;
  //   }, 0);

  //   return Math.round(totalPercentage / students.length);
  // }

  // Keep the original method for backward compatibility
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

  // Additional helper methods for getting attendance summaries
  async getAttendanceSummary(
    classLevelId: string,
    filterType: 'week' | 'month' | 'year' = 'month',
  ) {
    const filter: AttendanceFilter = {
      classLevelId,
      filterType,
    };

    const attendance = await this.getClassAttendance(filter);

    return {
      classLevel: attendance.classLevel,
      //summary: attendance.summary,
      dateRange: attendance.dateRange,
      studentSummaries: attendance.students.map((student) => ({
        id: student.id,
        fullName: student.fullName,
        statistics: student.statistics,
      })),
    };
  }
}
