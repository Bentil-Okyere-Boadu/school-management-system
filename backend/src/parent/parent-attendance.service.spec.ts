import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ParentAttendanceService } from './parent-attendance.service';
import { Attendance } from 'src/attendance/attendance.entity';
import { Holiday } from 'src/academic-calendar/entitites/holiday.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
describe('ParentAttendanceService', () => {
  let service: ParentAttendanceService;

  const mockStudent = {
    id: 'student-1',
    firstName: 'Jane',
    lastName: 'Doe',
    studentId: 'STU001',
    school: { id: 'school-1' },
    classLevels: [{ name: 'Grade 6' }],
    profile: null,
  };

  const mockTerm = {
    id: 'term-1',
    termName: 'Term 1',
    startDate: '2026-01-15',
    endDate: '2026-03-30',
  };

  const attendanceRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  const holidayQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const holidayRepository = {
    createQueryBuilder: jest.fn(() => holidayQueryBuilder),
  };

  const termQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockTerm]),
  };

  const academicTermRepository = {
    createQueryBuilder: jest.fn(() => termQueryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    termQueryBuilder.getMany.mockResolvedValue([mockTerm]);
    attendanceRepository.find.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentAttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: attendanceRepository,
        },
        { provide: getRepositoryToken(Holiday), useValue: holidayRepository },
        {
          provide: getRepositoryToken(AcademicTerm),
          useValue: academicTermRepository,
        },
      ],
    }).compile();

    service = module.get<ParentAttendanceService>(ParentAttendanceService);
  });

  describe('getMonthSheet term boundaries', () => {
    it('excludes pre-term weekdays from counts and marks them out_of_term', async () => {
      const result = await service.getMonthSheet(mockStudent as never, 2026, 1);

      expect(result.presentCount).toBe(12);
      expect(result.daysRecorded).toBe(12);
      expect(result.attendanceRate).toBe(100);

      const preTermDay = result.days.find((d) => d.date === '2026-01-07');
      expect(preTermDay?.status).toBe('out_of_term');

      const inTermDay = result.days.find((d) => d.date === '2026-01-15');
      expect(inTermDay?.status).toBe('present');
    });

    it('returns zero recorded days when no term overlaps the month', async () => {
      termQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getMonthSheet(mockStudent as never, 2026, 1);

      expect(result.presentCount).toBe(0);
      expect(result.absentCount).toBe(0);
      expect(result.daysRecorded).toBe(0);
      expect(result.attendanceRate).toBe(0);
    });
  });
});
