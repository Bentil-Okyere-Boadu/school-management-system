import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  PerformanceAnalyticsResponse,
  StudentAnalyticsService,
} from './student-analytics.service';
import { Student } from 'src/student/student.entity';
import { AssignmentSubmission } from 'src/student/entities/assignment-submission.entity';
import { Subject } from 'src/subject/subject.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { GradingSystemService } from 'src/grading-system/grading-system.service';

describe('StudentAnalyticsService', () => {
  let service: StudentAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentAnalyticsService,
        { provide: getRepositoryToken(Student), useValue: {} },
        { provide: getRepositoryToken(AssignmentSubmission), useValue: {} },
        { provide: getRepositoryToken(Subject), useValue: {} },
        { provide: getRepositoryToken(AcademicTerm), useValue: {} },
        { provide: getRepositoryToken(ClassLevel), useValue: {} },
        { provide: GradingSystemService, useValue: {} },
      ],
    }).compile();

    service = module.get<StudentAnalyticsService>(StudentAnalyticsService);
  });

  describe('assertPerformanceAnalyticsEnabled', () => {
    it('allows access when enabled or unset', () => {
      expect(() =>
        StudentAnalyticsService.assertPerformanceAnalyticsEnabled({
          performanceAnalyticsEnabled: true,
        }),
      ).not.toThrow();
      expect(() =>
        StudentAnalyticsService.assertPerformanceAnalyticsEnabled({}),
      ).not.toThrow();
    });

    it('throws when disabled for the school', () => {
      expect(() =>
        StudentAnalyticsService.assertPerformanceAnalyticsEnabled({
          performanceAnalyticsEnabled: false,
        }),
      ).toThrow(ForbiddenException);
    });
  });

  describe('maskPerformanceAnalyticsForParent', () => {
    const samplePayload: PerformanceAnalyticsResponse = {
      academicCalendar: { id: 'cal-1', name: '2025/2026' },
      selectedTerm: { id: 'term-1', termName: 'Term 1' },
      summary: {
        gradedAssignmentsCount: 2,
        assignmentAveragePercent: 78.5,
      },
      subjectAssignmentPerformance: [
        {
          subjectCatalogId: 'subj-1',
          subjectName: 'Math',
          gradedCount: 1,
          averagePercent: 80,
          topics: [
            {
              topicId: 'topic-1',
              topicName: 'Algebra',
              gradedCount: 1,
              averagePercent: 80,
              assignments: [
                {
                  submissionId: 'sub-1',
                  assignmentId: 'asg-1',
                  title: 'Quiz 1',
                  score: 8,
                  maxScore: 10,
                  percentage: 80,
                  dueDate: '2026-01-01T00:00:00.000Z',
                  assignmentType: 'online',
                  submissionStatus: 'graded',
                  submittedAt: '2026-01-01T00:00:00.000Z',
                  gradedAt: '2026-01-02T00:00:00.000Z',
                  classLevelName: 'Grade 6',
                },
              ],
            },
          ],
        },
      ],
    };

    it('returns payload unchanged when scores are visible', () => {
      const masked = service.maskPerformanceAnalyticsForParent(samplePayload, {
        showScores: true,
        showGrades: true,
        showLabels: true,
        showFeedback: true,
      });

      expect(masked.summary.assignmentAveragePercent).toBe(78.5);
      expect(masked.subjectAssignmentPerformance[0].averagePercent).toBe(80);
      expect(
        masked.subjectAssignmentPerformance[0].topics[0].assignments[0].score,
      ).toBe(8);
    });

    it('strips score fields when parent score visibility is disabled', () => {
      const masked = service.maskPerformanceAnalyticsForParent(samplePayload, {
        showScores: false,
        showGrades: true,
        showLabels: true,
        showFeedback: true,
      });

      expect(masked.summary.assignmentAveragePercent).toBeNull();
      expect(masked.subjectAssignmentPerformance[0].averagePercent).toBeNull();
      expect(
        masked.subjectAssignmentPerformance[0].topics[0].averagePercent,
      ).toBeNull();
      const assignment =
        masked.subjectAssignmentPerformance[0].topics[0].assignments[0];
      expect(assignment.score).toBeNull();
      expect(assignment.maxScore).toBeNull();
      expect(assignment.percentage).toBeNull();
      expect(assignment.title).toBe('Quiz 1');
    });
  });
});
