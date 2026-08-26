import { BadRequestException } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { StudentGrade } from './student-grade.entity';
import { ClassLevelResultApproval } from 'src/class-level/class-level-result-approval.entity';

describe('SubjectService lifecycle helpers', () => {
  let service: SubjectService;

  const classLevelResultApprovalRepository = {
    findOne: jest.fn(),
    save: jest.fn(async (value) => value),
    create: jest.fn((value) => value),
  };
  const classLevelRepository = {
    findOne: jest.fn(),
  };
  const academicTermRepository = {
    findOne: jest.fn(),
  };
  const subjectRepository = {
    find: jest.fn(),
  };
  const studentGradeRepository = {
    find: jest.fn(),
  };
  const gradeSubmissionHistoryRepository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubjectService(
      subjectRepository as never,
      {} as never,
      classLevelRepository as never,
      {} as never,
      {} as never,
      studentGradeRepository as never,
      academicTermRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      classLevelResultApprovalRepository as never,
      gradeSubmissionHistoryRepository as never,
      { create: jest.fn(), createForRecipients: jest.fn() } as never,
      {} as never,
      {} as never,
    );
  });

  describe('isGradeComplete', () => {
    it('requires both scores when override is disabled', () => {
      const complete = (service as unknown as { isGradeComplete: Function })
        .isGradeComplete({ classScore: 20, examScore: 60, overrideGrade: null, overrideReason: null });
      const incomplete = (service as unknown as { isGradeComplete: Function })
        .isGradeComplete({ classScore: 20, examScore: null, overrideGrade: null, overrideReason: null });

      expect(complete).toBe(true);
      expect(incomplete).toBe(false);
    });

    it('accepts valid override when enabled', () => {
      const complete = (service as unknown as { isGradeComplete: Function })
        .isGradeComplete(
          { classScore: null, examScore: null, overrideGrade: 'A', overrideReason: 'Merit' },
          true,
        );

      expect(complete).toBe(true);
    });
  });

  describe('adminCheckResults', () => {
    const schoolAdmin = {
      id: 'admin-1',
      firstName: 'Ada',
      lastName: 'Admin',
      school: { id: 'school-1' },
    } as never;

    beforeEach(() => {
      classLevelRepository.findOne.mockResolvedValue({
        id: 'class-1',
        name: 'Grade 8',
        students: [],
        classTeacher: null,
      });
      academicTermRepository.findOne.mockResolvedValue({ id: 'term-1', termName: 'Term 1' });
      subjectRepository.find.mockResolvedValue([]);
      studentGradeRepository.find.mockResolvedValue([]);
      jest
        .spyOn(service as any, 'resolveGradingScheme')
        .mockResolvedValue({ allowManualOverride: false, bands: [] });
    });

    it('rejects checking published results', async () => {
      const approval: Partial<ClassLevelResultApproval> = {
        id: 'approval-1',
        resultStatus: 'published',
        approved: true,
      };
      classLevelResultApprovalRepository.findOne.mockResolvedValue(approval);

      await expect(
        service.adminCheckResults('class-1', 'term-1', schoolAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows checking only submitted results', async () => {
      const approval: Partial<ClassLevelResultApproval> = {
        id: 'approval-1',
        resultStatus: 'submitted',
        approved: true,
      };
      classLevelResultApprovalRepository.findOne.mockResolvedValue(approval);

      const result = await service.adminCheckResults('class-1', 'term-1', schoolAdmin);

      expect(result.resultStatus).toBe('approved');
      expect(classLevelResultApprovalRepository.save).toHaveBeenCalled();
    });
  });

  describe('adminReturnResults', () => {
    const schoolAdmin = {
      id: 'admin-1',
      firstName: 'Ada',
      lastName: 'Admin',
      school: { id: 'school-1' },
    } as never;

    beforeEach(() => {
      classLevelRepository.findOne.mockResolvedValue({
        id: 'class-1',
        name: 'Grade 8',
        classTeacher: null,
      });
      academicTermRepository.findOne.mockResolvedValue({ id: 'term-1', termName: 'Term 1' });
      subjectRepository.find.mockResolvedValue([]);
    });

    it('clears teacher approval flags when returning results', async () => {
      const approval: Partial<ClassLevelResultApproval> = {
        id: 'approval-1',
        resultStatus: 'submitted',
        approved: true,
        approvedAt: new Date(),
      };
      classLevelResultApprovalRepository.findOne.mockResolvedValue(approval);

      const result = await service.adminReturnResults(
        'class-1',
        'term-1',
        'Fix exam scores',
        schoolAdmin,
      );

      expect(result.resultStatus).toBe('returned');
      expect(classLevelResultApprovalRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          approved: false,
          approvedAt: undefined,
          resultStatus: 'returned',
        }),
      );
    });
  });

  describe('mapGradeToSubjectResult parent redaction', () => {
    it('redacts override metadata when grades are hidden', () => {
      const grade = {
        subject: { subjectCatalog: { name: 'Math' } },
        classScore: 20,
        examScore: 60,
        totalScore: 80,
        grade: 'A',
        gradeLabel: 'Excellent',
        bandDescription: 'Top',
        feedback: 'Great',
        overrideGrade: 'A',
        overrideReason: 'Merit',
        gradingSchemeId: null,
        gradingSchemeVersion: null,
      } as StudentGrade;

      const mapped = (service as unknown as {
        mapGradeToSubjectResult: Function;
      }).mapGradeToSubjectResult(grade, {
        showScores: false,
        showGrades: false,
        showLabels: false,
        showFeedback: false,
      });

      expect(mapped.grade).toBeNull();
      expect(mapped.hasOverride).toBe(false);
      expect(mapped.overrideReason).toBeNull();
      expect(mapped.feedback).toBeNull();
    });
  });
});
