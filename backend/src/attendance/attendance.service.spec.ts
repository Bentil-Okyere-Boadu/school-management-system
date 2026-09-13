import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { Attendance } from './attendance.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { Holiday } from '../academic-calendar/entitites/holiday.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from '../academic-calendar/entitites/academic-calendar.entity';
import { Student } from '../student/student.entity';
import { NotificationService } from '../notification/notification.service';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const schoolId = 'school-1';
  const classLevelId = 'class-1';
  const studentId = 'student-1';

  const mockClassLevel = {
    id: classLevelId,
    name: 'Grade 6',
    school: { id: schoolId },
    students: [
      {
        id: studentId,
        firstName: 'Jane',
        lastName: 'Doe',
        isArchived: false,
        updatedAt: new Date(),
      },
    ],
  };

  const mockTerm = {
    id: 'term-1',
    termName: 'Term 1',
    startDate: '2026-01-15',
    endDate: '2026-03-30',
  };

  const classLevelRepository = {
    findOne: jest.fn(),
  };

  const attendanceRepository = {
    find: jest.fn(),
  };

  const holidayQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getExists: jest.fn(),
  };

  const holidayRepository = {
    createQueryBuilder: jest.fn(() => holidayQueryBuilder),
  };

  const termQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  const academicTermRepository = {
    createQueryBuilder: jest.fn(() => termQueryBuilder),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    classLevelRepository.findOne.mockResolvedValue(mockClassLevel);
    attendanceRepository.find.mockResolvedValue([]);
    termQueryBuilder.getMany.mockResolvedValue([mockTerm]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: getRepositoryToken(Attendance), useValue: attendanceRepository },
        { provide: getRepositoryToken(ClassLevel), useValue: classLevelRepository },
        { provide: getRepositoryToken(Holiday), useValue: holidayRepository },
        {
          provide: getRepositoryToken(AcademicTerm),
          useValue: academicTermRepository,
        },
        {
          provide: getRepositoryToken(AcademicCalendar),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Student),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: NotificationService,
          useValue: { notifyStudentAbsent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClassAttendance term boundaries', () => {
    it('excludes weekdays before term start from month statistics', async () => {
      const result = await service.getClassAttendance({
        classLevelId,
        filterType: 'month',
        year: 2026,
        month: 1,
      });

      const student = result.students[0] as any;
      expect(student.statistics.totalDaysInRange).toBe(12);
      expect(student.statistics.presentCount).toBe(12);
      expect(student.attendanceByDate['2026-01-05']).toBe('out_of_term');
      expect(student.attendanceByDate['2026-01-15']).toBe('present');
    });

    it('does not count unmarked pre-term days as present', async () => {
      const result = await service.getClassAttendance({
        classLevelId,
        filterType: 'month',
        year: 2026,
        month: 1,
      });

      const student = result.students[0] as any;
      expect(student.attendanceByDate['2026-01-07']).toBe('out_of_term');
      expect(student.statistics.presentCount).toBe(12);
    });

    it('scopes custom ranges to overlapping term days', async () => {
      const result = await service.getClassAttendance({
        classLevelId,
        filterType: 'custom',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(result.students[0].statistics.totalDaysInRange).toBe(12);
      expect(result.summary.averageAttendanceRate).toBe(100);
    });

    it('returns zero school days when no term overlaps the range', async () => {
      termQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getClassAttendance({
        classLevelId,
        filterType: 'month',
        year: 2026,
        month: 1,
      });

      expect(result.students[0].statistics.totalDaysInRange).toBe(0);
      expect(result.students[0].statistics.presentCount).toBe(0);
      expect(result.summary.averageAttendanceRate).toBe(0);
    });
  });

  describe('markAttendance term boundaries', () => {
    beforeEach(() => {
      classLevelRepository.findOne.mockResolvedValue({
        id: classLevelId,
        school: { id: schoolId },
      });
      holidayQueryBuilder.getExists.mockResolvedValue(false);
    });

    it('rejects marking attendance before the term begins', async () => {
      termQueryBuilder.getOne.mockResolvedValue(null);
      termQueryBuilder.getMany.mockResolvedValue([mockTerm]);

      await expect(
        service.markAttendance(classLevelId, '2026-01-05', [
          { studentId, status: 'present' },
        ]),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.markAttendance(classLevelId, '2026-01-05', [
          { studentId, status: 'present' },
        ]),
      ).rejects.toThrow(
        'Cannot mark attendance before the term begins on 2026-01-15',
      );
    });

    it('rejects marking attendance after the term ends', async () => {
      termQueryBuilder.getOne.mockResolvedValue(null);
      termQueryBuilder.getMany.mockResolvedValue([mockTerm]);

      await expect(
        service.markAttendance(classLevelId, '2026-04-01', [
          { studentId, status: 'present' },
        ]),
      ).rejects.toThrow(
        'Cannot mark attendance after the term ends on 2026-03-30',
      );
    });
  });
});
