import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/student/student.entity';
import { AssignmentSubmission } from 'src/student/entities/assignment-submission.entity';
import { Subject } from 'src/subject/subject.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';

/** One graded submission row under a curriculum topic */
export type TopicAssignmentGradeDetail = {
  submissionId: string;
  assignmentId: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  dueDate: string;
  assignmentType: 'online' | 'offline';
  submissionStatus: string;
  submittedAt: string;
  gradedAt: string;
  classLevelName: string;
};

export type PerformanceAnalyticsResponse = {
  academicCalendar: { id: string; name: string };
  selectedTerm: { id: string; termName: string };
  summary: {
    gradedAssignmentsCount: number;
    assignmentAveragePercent: number | null;
  };
  subjectAssignmentPerformance: Array<{
    subjectCatalogId: string;
    subjectName: string;
    gradedCount: number;
    averagePercent: number | null;
    topics: Array<{
      topicId: string;
      topicName: string;
      gradedCount: number;
      averagePercent: number | null;
      assignments: TopicAssignmentGradeDetail[];
    }>;
  }>;
};

@Injectable()
export class StudentAnalyticsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(AssignmentSubmission)
    private readonly submissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(AcademicTerm)
    private readonly academicTermRepository: Repository<AcademicTerm>,
    @InjectRepository(ClassLevel)
    private readonly classLevelRepository: Repository<ClassLevel>,
  ) {}

  async getPerformanceAnalyticsForSchoolAdmin(
    admin: SchoolAdmin,
    studentId: string,
    academicTermId: string,
  ): Promise<PerformanceAnalyticsResponse> {
    await this.ensureAdminCanAccessStudent(admin, studentId);
    return this.buildPerformanceAnalytics(studentId, academicTermId, null);
  }

  async getPerformanceAnalyticsForTeacher(
    teacher: Teacher,
    studentId: string,
    academicTermId: string,
  ): Promise<PerformanceAnalyticsResponse> {
    await this.ensureTeacherCanAccessStudent(teacher, studentId);
    const catalogIds = await this.getTeacherSubjectCatalogIdsForStudent(
      teacher.id,
      studentId,
    );
    return this.buildPerformanceAnalytics(
      studentId,
      academicTermId,
      catalogIds,
    );
  }

  async getPerformanceAnalyticsForStudent(
    student: Student,
    academicTermId: string,
  ): Promise<PerformanceAnalyticsResponse> {
    return this.buildPerformanceAnalytics(student.id, academicTermId, null);
  }

  private async ensureAdminCanAccessStudent(
    admin: SchoolAdmin,
    studentId: string,
  ): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (student.school.id !== admin.school.id) {
      throw new ForbiddenException('You cannot access this student');
    }
  }

  private async ensureTeacherCanAccessStudent(
    teacher: Teacher,
    studentId: string,
  ): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school', 'classLevels'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (student.school.id !== teacher.school.id) {
      throw new ForbiddenException('You cannot access this student');
    }
    const teacherClassIds = await this.getTeacherAssociatedClassLevelIds(
      teacher.id,
    );
    const studentClassIds = student.classLevels.map((cl) => cl.id);
    const overlap = studentClassIds.some((id) => teacherClassIds.includes(id));
    if (!overlap) {
      throw new ForbiddenException('You cannot access this student');
    }
  }

  private async getTeacherAssociatedClassLevelIds(
    teacherId: string,
  ): Promise<string[]> {
    const assignedClassLevels = await this.classLevelRepository
      .createQueryBuilder('classLevel')
      .innerJoin('classLevel.teachers', 'teacher')
      .where('teacher.id = :teacherId', { teacherId })
      .select('classLevel.id', 'id')
      .getRawMany<{ id: string }>();

    const classesAsClassTeacher = await this.classLevelRepository
      .createQueryBuilder('classLevel')
      .leftJoin('classLevel.classTeacher', 'classTeacher')
      .where('classTeacher.id = :teacherId', { teacherId })
      .select('classLevel.id', 'id')
      .getRawMany<{ id: string }>();

    const ids = [
      ...assignedClassLevels.map((r) => r.id),
      ...classesAsClassTeacher.map((r) => r.id),
    ];
    return [...new Set(ids)];
  }

  private async getTeacherSubjectCatalogIdsForStudent(
    teacherId: string,
    studentId: string,
  ): Promise<string[]> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['classLevels'],
    });
    if (!student?.classLevels?.length) {
      return [];
    }
    const studentClassIds = new Set(student.classLevels.map((c) => c.id));

    const subjects = await this.subjectRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['classLevels', 'subjectCatalog'],
    });

    const catalogIds = new Set<string>();
    for (const sub of subjects) {
      if (sub.classLevels?.some((cl) => studentClassIds.has(cl.id))) {
        catalogIds.add(sub.subjectCatalog.id);
      }
    }
    return [...catalogIds];
  }

  private async buildPerformanceAnalytics(
    studentId: string,
    academicTermId: string,
    restrictToSubjectCatalogIds: string[] | null,
  ): Promise<PerformanceAnalyticsResponse> {
    const selectedTermEntity = await this.academicTermRepository.findOne({
      where: { id: academicTermId },
      relations: ['academicCalendar', 'academicCalendar.school'],
    });

    if (!selectedTermEntity) {
      throw new NotFoundException('Academic term not found');
    }

    const calendar = selectedTermEntity.academicCalendar;

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['classLevels'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (calendar.school.id !== student.school.id) {
      throw new ForbiddenException(
        'This academic term does not belong to the student school',
      );
    }

    const rawSubs = await this.submissionRepository
      .createQueryBuilder('sub')
      .innerJoinAndSelect('sub.assignment', 'assignment')
      .innerJoinAndSelect('assignment.topic', 'topic')
      .innerJoinAndSelect('topic.subjectCatalog', 'catalog')
      .leftJoinAndSelect('topic.academicTerm', 'topicTerm')
      .leftJoinAndSelect('topicTerm.academicCalendar', 'topicCal')
      .innerJoinAndSelect('assignment.classLevel', 'assClass')
      .where('sub.student.id = :studentId', { studentId })
      .andWhere('sub.score IS NOT NULL')
      .andWhere('assignment.maxScore > 0')
      .getMany();

    const studentClassIdSet = new Set(student.classLevels.map((c) => c.id));

    const filteredSubs = rawSubs.filter((sub) => {
      if (!studentClassIdSet.has(sub.assignment.classLevel.id)) {
        return false;
      }
      const topicTermId = sub.assignment.topic.academicTerm?.id;
      return topicTermId === academicTermId;
    });

    type Row = {
      catalogId: string;
      catalogName: string;
      topicId: string;
      topicName: string;
      percent: number;
      detail: TopicAssignmentGradeDetail;
    };

    let assignmentRows: Row[] = filteredSubs.map((sub) => {
      const pct = (Number(sub.score) / Number(sub.assignment.maxScore)) * 100;
      const roundedPct = Math.round(Math.min(100, Math.max(0, pct)) * 10) / 10;
      const due = sub.assignment.dueDate;
      const dueDateIso =
        due instanceof Date ? due.toISOString() : new Date(due).toISOString();
      const detail: TopicAssignmentGradeDetail = {
        submissionId: sub.id,
        assignmentId: sub.assignment.id,
        title: sub.assignment.title,
        score: Number(sub.score),
        maxScore: sub.assignment.maxScore,
        percentage: roundedPct,
        dueDate: dueDateIso,
        assignmentType: sub.assignment.assignmentType,
        submissionStatus: sub.status,
        submittedAt: sub.createdAt.toISOString(),
        gradedAt: sub.updatedAt.toISOString(),
        classLevelName: sub.assignment.classLevel.name,
      };
      return {
        catalogId: sub.assignment.topic.subjectCatalog.id,
        catalogName: sub.assignment.topic.subjectCatalog.name,
        topicId: sub.assignment.topic.id,
        topicName: sub.assignment.topic.name,
        percent: roundedPct,
        detail,
      };
    });

    if (restrictToSubjectCatalogIds?.length) {
      const allow = new Set(restrictToSubjectCatalogIds);
      assignmentRows = assignmentRows.filter((r) => allow.has(r.catalogId));
    }

    const gradedAssignmentsCount = assignmentRows.length;
    const assignmentAvg =
      gradedAssignmentsCount > 0
        ? Math.round(
            (assignmentRows.reduce((a, r) => a + r.percent, 0) /
              gradedAssignmentsCount) *
              10,
          ) / 10
        : null;

    const bySubject = new Map<
      string,
      {
        subjectName: string;
        percents: number[];
        topics: Map<
          string,
          {
            topicName: string;
            percents: number[];
            assignments: TopicAssignmentGradeDetail[];
          }
        >;
      }
    >();

    for (const row of assignmentRows) {
      let subj = bySubject.get(row.catalogId);
      if (!subj) {
        subj = {
          subjectName: row.catalogName,
          percents: [],
          topics: new Map(),
        };
        bySubject.set(row.catalogId, subj);
      }
      subj.percents.push(row.percent);
      let top = subj.topics.get(row.topicId);
      if (!top) {
        top = {
          topicName: row.topicName,
          percents: [],
          assignments: [],
        };
        subj.topics.set(row.topicId, top);
      }
      top.percents.push(row.percent);
      top.assignments.push(row.detail);
    }

    const subjectAssignmentPerformance: PerformanceAnalyticsResponse['subjectAssignmentPerformance'] =
      [...bySubject.entries()].map(([subjectCatalogId, data]) => {
        const avg =
          data.percents.length > 0
            ? Math.round(
                (data.percents.reduce((a, b) => a + b, 0) /
                  data.percents.length) *
                  10,
              ) / 10
            : null;
        const topics = [...data.topics.entries()].map(([topicId, t]) => {
          const assignments = [...t.assignments].sort((x, y) =>
            y.dueDate.localeCompare(x.dueDate),
          );
          return {
            topicId,
            topicName: t.topicName,
            gradedCount: t.percents.length,
            averagePercent:
              t.percents.length > 0
                ? Math.round(
                    (t.percents.reduce((a, b) => a + b, 0) /
                      t.percents.length) *
                      10,
                  ) / 10
                : null,
            assignments,
          };
        });
        topics.sort((a, b) => a.topicName.localeCompare(b.topicName));
        return {
          subjectCatalogId,
          subjectName: data.subjectName,
          gradedCount: data.percents.length,
          averagePercent: avg,
          topics,
        };
      });

    subjectAssignmentPerformance.sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName),
    );

    return {
      academicCalendar: { id: calendar.id, name: calendar.name },
      selectedTerm: {
        id: selectedTermEntity.id,
        termName: selectedTermEntity.termName,
      },
      summary: {
        gradedAssignmentsCount,
        assignmentAveragePercent: assignmentAvg,
      },
      subjectAssignmentPerformance,
    };
  }
}
