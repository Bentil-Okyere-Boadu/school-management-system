import {
  BadRequestException,
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
import { GradingSystem } from 'src/grading-system/grading-system.entity';
import { GradingSystemService } from 'src/grading-system/grading-system.service';

export type ClusterName =
  | 'Below Expectations'
  | 'Developing'
  | 'On Track'
  | 'Meeting Expectations';

export type ClassSubjectPerformanceResponse = {
  classLevel: { id: string; name: string };
  academicTerm: { id: string; termName: string };
  subject: { id: string; name: string };
  aggregation: {
    asOfDate: string;
    latestGradedAt: string | null;
    gradedAssignmentsCount: number;
  };
  summary: {
    totalStudents: number;
    classAverage: number | null;
    medianScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
  };
  clusterDistribution: {
    belowExpectations: number;
    developing: number;
    onTrack: number;
    meetingExpectations: number;
  };
  students: Array<{
    studentId: string;
    studentName: string;
    classLevelName: string;
    subjectName: string;
    aggregatedScore: number | null;
    rank: number;
    cluster: ClusterName | null;
  }>;
};

export type StudentTopicPerformanceResponse = {
  student: {
    id: string;
    name: string;
    classLevelName: string;
    overallAveragePercent: number | null;
    cluster: ClusterName | null;
  };
  academicTerm: { id: string; termName: string };
  subject: { id: string; name: string };
  topics: Array<{
    topicId: string;
    topicName: string;
    studentAggregatedScore: number | null;
    classAverage: number | null;
    range: { min: number | null; max: number | null };
    median: number | null;
    testCount: number;
    cluster: ClusterName | null;
  }>;
};

export type TeacherAnalyticsSubjectsResponse = {
  classLevelId: string;
  isClassTeacher: boolean;
  subjects: Array<{ id: string; name: string }>;
};

export type ClassSubjectPerformanceFilters = {
  cluster?: ClusterName;
  scoreRangeMin?: number;
  scoreRangeMax?: number;
  aggregatedAsOf?: string;
};

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
    private readonly gradingSystemService: GradingSystemService,
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

    const classesViaSubject = await this.subjectRepository
      .createQueryBuilder('subject')
      .innerJoin('subject.classLevels', 'classLevel')
      .innerJoin('subject.teacher', 'teacher')
      .where('teacher.id = :teacherId', { teacherId })
      .select('classLevel.id', 'id')
      .getRawMany<{ id: string }>();

    const ids = [
      ...assignedClassLevels.map((r) => r.id),
      ...classesAsClassTeacher.map((r) => r.id),
      ...classesViaSubject.map((r) => r.id),
    ];
    return [...new Set(ids)];
  }

  private async isTeacherClassTeacherOfClass(
    teacherId: string,
    classLevelId: string,
  ): Promise<boolean> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['classTeacher'],
    });
    return classLevel?.classTeacher?.id === teacherId;
  }

  private async teacherTeachesSubjectInClass(
    teacherId: string,
    classLevelId: string,
    subjectCatalogId: string,
  ): Promise<boolean> {
    const count = await this.subjectRepository
      .createQueryBuilder('subject')
      .innerJoin('subject.classLevels', 'classLevel')
      .innerJoin('subject.subjectCatalog', 'catalog')
      .innerJoin('subject.teacher', 'teacher')
      .where('teacher.id = :teacherId', { teacherId })
      .andWhere('classLevel.id = :classLevelId', { classLevelId })
      .andWhere('catalog.id = :subjectCatalogId', { subjectCatalogId })
      .getCount();
    return count > 0;
  }

  private async ensureTeacherCanAccessClassForAnalytics(
    teacher: Teacher,
    classLevelId: string,
  ): Promise<ClassLevel> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['school', 'classTeacher', 'students'],
    });
    if (!classLevel) {
      throw new NotFoundException('Class not found');
    }
    if (classLevel.school.id !== teacher.school.id) {
      throw new ForbiddenException('You cannot access this class');
    }

    const associatedIds = await this.getTeacherAssociatedClassLevelIds(
      teacher.id,
    );
    if (!associatedIds.includes(classLevelId)) {
      throw new ForbiddenException('You cannot access this class');
    }
    return classLevel;
  }

  private async ensureTeacherCanAccessSubjectInClass(
    teacher: Teacher,
    classLevelId: string,
    subjectCatalogId: string,
  ): Promise<void> {
    await this.ensureTeacherCanAccessClassForAnalytics(teacher, classLevelId);

    const isClassTeacher = await this.isTeacherClassTeacherOfClass(
      teacher.id,
      classLevelId,
    );
    if (isClassTeacher) return;

    const teaches = await this.teacherTeachesSubjectInClass(
      teacher.id,
      classLevelId,
      subjectCatalogId,
    );
    if (!teaches) {
      throw new ForbiddenException(
        'You cannot access performance analytics for this subject',
      );
    }
  }

  private async ensureTeacherCanAccessTopicPerformance(
    teacher: Teacher,
    studentId: string,
    subjectCatalogId: string,
  ): Promise<void> {
    await this.ensureTeacherCanAccessStudent(teacher, studentId);

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['classLevels'],
    });
    if (!student?.classLevels?.length) {
      throw new ForbiddenException('You cannot access this student');
    }

    const studentClassIds = student.classLevels.map((cl) => cl.id);
    const teacherClassIds = await this.getTeacherAssociatedClassLevelIds(
      teacher.id,
    );
    const overlapIds = studentClassIds.filter((id) =>
      teacherClassIds.includes(id),
    );

    for (const classLevelId of overlapIds) {
      const isClassTeacher = await this.isTeacherClassTeacherOfClass(
        teacher.id,
        classLevelId,
      );
      if (isClassTeacher) return;

      const teaches = await this.teacherTeachesSubjectInClass(
        teacher.id,
        classLevelId,
        subjectCatalogId,
      );
      if (teaches) return;
    }

    throw new ForbiddenException(
      'You cannot access performance analytics for this subject',
    );
  }

  async getTeacherAnalyticsSubjectsForClass(
    teacher: Teacher,
    classLevelId: string,
  ): Promise<TeacherAnalyticsSubjectsResponse> {
    await this.ensureTeacherCanAccessClassForAnalytics(teacher, classLevelId);

    const isClassTeacher = await this.isTeacherClassTeacherOfClass(
      teacher.id,
      classLevelId,
    );

    let subjects: Subject[];
    if (isClassTeacher) {
      subjects = await this.subjectRepository
        .createQueryBuilder('subject')
        .innerJoinAndSelect('subject.subjectCatalog', 'catalog')
        .innerJoin('subject.classLevels', 'classLevel')
        .innerJoin('subject.school', 'school')
        .where('classLevel.id = :classLevelId', { classLevelId })
        .andWhere('school.id = :schoolId', {
          schoolId: teacher.school.id,
        })
        .orderBy('catalog.name', 'ASC')
        .getMany();
    } else {
      subjects = await this.subjectRepository
        .createQueryBuilder('subject')
        .innerJoinAndSelect('subject.subjectCatalog', 'catalog')
        .innerJoin('subject.classLevels', 'classLevel')
        .innerJoin('subject.teacher', 'assignedTeacher')
        .innerJoin('subject.school', 'school')
        .where('classLevel.id = :classLevelId', { classLevelId })
        .andWhere('assignedTeacher.id = :teacherId', {
          teacherId: teacher.id,
        })
        .andWhere('school.id = :schoolId', {
          schoolId: teacher.school.id,
        })
        .orderBy('catalog.name', 'ASC')
        .getMany();
    }

    const seen = new Set<string>();
    const catalogSubjects: Array<{ id: string; name: string }> = [];
    for (const subject of subjects) {
      const catalog = subject.subjectCatalog;
      if (!catalog || seen.has(catalog.id)) continue;
      seen.add(catalog.id);
      catalogSubjects.push({ id: catalog.id, name: catalog.name });
    }

    return {
      classLevelId,
      isClassTeacher,
      subjects: catalogSubjects,
    };
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
      detail: TopicAssignmentGradeDetail;
    };

    let assignmentRows: Row[] = filteredSubs.map((sub) => {
      const roundedPct = this.submissionPercent(
        Number(sub.score),
        Number(sub.assignment.maxScore),
      );
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
        detail,
      };
    });

    if (restrictToSubjectCatalogIds?.length) {
      const allow = new Set(restrictToSubjectCatalogIds);
      assignmentRows = assignmentRows.filter((r) => allow.has(r.catalogId));
    }

    const gradedAssignmentsCount = assignmentRows.length;
    const assignmentAvg = this.weightedAveragePercent(
      assignmentRows.map((r) => ({
        score: r.detail.score,
        maxScore: r.detail.maxScore,
      })),
    );

    type ScoreMaxPair = { score: number; maxScore: number };

    const bySubject = new Map<
      string,
      {
        subjectName: string;
        scorePairs: ScoreMaxPair[];
        topics: Map<
          string,
          {
            topicName: string;
            scorePairs: ScoreMaxPair[];
            assignments: TopicAssignmentGradeDetail[];
          }
        >;
      }
    >();

    for (const row of assignmentRows) {
      const pair = { score: row.detail.score, maxScore: row.detail.maxScore };
      let subj = bySubject.get(row.catalogId);
      if (!subj) {
        subj = {
          subjectName: row.catalogName,
          scorePairs: [],
          topics: new Map(),
        };
        bySubject.set(row.catalogId, subj);
      }
      subj.scorePairs.push(pair);
      let top = subj.topics.get(row.topicId);
      if (!top) {
        top = {
          topicName: row.topicName,
          scorePairs: [],
          assignments: [],
        };
        subj.topics.set(row.topicId, top);
      }
      top.scorePairs.push(pair);
      top.assignments.push(row.detail);
    }

    const subjectAssignmentPerformance: PerformanceAnalyticsResponse['subjectAssignmentPerformance'] =
      [...bySubject.entries()].map(([subjectCatalogId, data]) => {
        const avg = this.weightedAveragePercent(data.scorePairs);
        const topics = [...data.topics.entries()].map(([topicId, t]) => {
          const assignments = [...t.assignments].sort((x, y) =>
            y.dueDate.localeCompare(x.dueDate),
          );
          return {
            topicId,
            topicName: t.topicName,
            gradedCount: t.scorePairs.length,
            averagePercent: this.weightedAveragePercent(t.scorePairs),
            assignments,
          };
        });
        topics.sort((a, b) => a.topicName.localeCompare(b.topicName));
        return {
          subjectCatalogId,
          subjectName: data.subjectName,
          gradedCount: data.scorePairs.length,
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

  // ─── Cluster / stats helpers ────────────────────────────────────────────────

  private roundPercent(n: number): number {
    return Math.round(n);
  }

  /** End of calendar day UTC for YYYY-MM-DD (inclusive graded-through date). */
  private parseAggregatedAsOfDate(isoDate: string): string | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (
      probe.getUTCFullYear() !== year ||
      probe.getUTCMonth() !== month - 1 ||
      probe.getUTCDate() !== day
    ) {
      return null;
    }
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  private gradedDateKey(sub: AssignmentSubmission): string {
    const d = this.submissionGradedAt(sub);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private submissionGradedAt(sub: AssignmentSubmission): Date {
    return sub.updatedAt instanceof Date
      ? sub.updatedAt
      : new Date(sub.updatedAt);
  }

  private computeMedian(sortedAsc: number[]): number | null {
    if (!sortedAsc.length) return null;
    const mid = Math.floor(sortedAsc.length / 2);
    return sortedAsc.length % 2 === 0
      ? this.roundPercent((sortedAsc[mid - 1] + sortedAsc[mid]) / 2)
      : sortedAsc[mid];
  }

  private submissionPercent(score: number, maxScore: number): number {
    return this.roundPercent(
      Math.min(100, Math.max(0, (Number(score) / Number(maxScore)) * 100)),
    );
  }

  /** Total earned ÷ total possible, as a percentage (point-weighted average). */
  private weightedAveragePercent(
    items: Array<{ score: number; maxScore: number }>,
  ): number | null {
    if (!items.length) return null;
    const totalScore = items.reduce((sum, i) => sum + Number(i.score), 0);
    const totalMax = items.reduce((sum, i) => sum + Number(i.maxScore), 0);
    if (totalMax <= 0) return null;
    return this.roundPercent((totalScore / totalMax) * 100);
  }

  private async loadGradingBands(schoolId: string): Promise<GradingSystem[]> {
    const bands = await this.gradingSystemService.findAllBySchool(schoolId);
    if (bands.length) return bands;

    return [
      { grade: 'A', minRange: 80, maxRange: 100 },
      { grade: 'B', minRange: 70, maxRange: 79 },
      { grade: 'C', minRange: 60, maxRange: 69 },
      { grade: 'D', minRange: 50, maxRange: 59 },
      { grade: 'E', minRange: 45, maxRange: 49 },
      { grade: 'F', minRange: 0, maxRange: 44 },
    ] as GradingSystem[];
  }

  private gradeLetterToCluster(grade: string): ClusterName | null {
    const normalized = grade.trim().toUpperCase();
    if (['F', 'E'].includes(normalized)) return 'Below Expectations';
    if (normalized === 'D') return 'Developing';
    if (normalized === 'C') return 'On Track';
    if (['B', 'A'].includes(normalized)) return 'Meeting Expectations';
    return null;
  }

  /** Fallback for custom grade labels not in the standard A–F map. */
  private clusterFromBandMinRange(minRange: number): ClusterName {
    if (minRange >= 70) return 'Meeting Expectations';
    if (minRange >= 60) return 'On Track';
    if (minRange >= 50) return 'Developing';
    return 'Below Expectations';
  }

  /**
   * Resolve a score to a grading band. Handles decimal averages that fall in
   * gaps between integer band boundaries (e.g. 79.2 between B max 79 and A min 80).
   */
  private findGradingBandForScore(
    score: number,
    gradingBands: GradingSystem[],
  ): GradingSystem | null {
    if (!gradingBands.length) return null;

    const clamped = Math.min(100, Math.max(0, score));

    const exact = gradingBands.find(
      (gs) => clamped >= gs.minRange && clamped <= gs.maxRange,
    );
    if (exact) return exact;

    // Score sits in a gap — use the band with the highest minRange still <= score
    const byMinDesc = [...gradingBands].sort((a, b) => b.minRange - a.minRange);
    const lowerBand = byMinDesc.find((gs) => clamped >= gs.minRange);
    if (lowerBand) return lowerBand;

    // Below every band (should not happen when bands start at 0)
    const byMinAsc = [...gradingBands].sort((a, b) => a.minRange - b.minRange);
    return byMinAsc[0] ?? null;
  }

  private assignClusterByScore(
    score: number,
    gradingBands: GradingSystem[],
  ): ClusterName | null {
    const band = this.findGradingBandForScore(score, gradingBands);
    if (!band) return null;
    return (
      this.gradeLetterToCluster(band.grade) ??
      this.clusterFromBandMinRange(band.minRange)
    );
  }

  // ─── Class-level subject performance (Screen 1) ─────────────────────────────

  async getClassSubjectPerformance(
    admin: SchoolAdmin,
    classLevelId: string,
    academicTermId: string,
    subjectCatalogId: string,
    filters: ClassSubjectPerformanceFilters = {},
  ): Promise<ClassSubjectPerformanceResponse> {
    return this.buildClassSubjectPerformance(
      admin.school.id,
      classLevelId,
      academicTermId,
      subjectCatalogId,
      filters,
    );
  }

  async getClassSubjectPerformanceForTeacher(
    teacher: Teacher,
    classLevelId: string,
    academicTermId: string,
    subjectCatalogId: string,
    filters: ClassSubjectPerformanceFilters = {},
  ): Promise<ClassSubjectPerformanceResponse> {
    await this.ensureTeacherCanAccessSubjectInClass(
      teacher,
      classLevelId,
      subjectCatalogId,
    );
    return this.buildClassSubjectPerformance(
      teacher.school.id,
      classLevelId,
      academicTermId,
      subjectCatalogId,
      filters,
    );
  }

  private async buildClassSubjectPerformance(
    schoolId: string,
    classLevelId: string,
    academicTermId: string,
    subjectCatalogId: string,
    filters: ClassSubjectPerformanceFilters = {},
  ): Promise<ClassSubjectPerformanceResponse> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId, school: { id: schoolId } },
      relations: ['students', 'school'],
    });
    if (!classLevel) {
      throw new NotFoundException('Class not found');
    }

    const termEntity = await this.academicTermRepository.findOne({
      where: { id: academicTermId },
      relations: ['academicCalendar'],
    });
    if (!termEntity) {
      throw new NotFoundException('Academic term not found');
    }

    const gradingBands = await this.loadGradingBands(schoolId);

    const allSubs = await this.submissionRepository
      .createQueryBuilder('sub')
      .innerJoinAndSelect('sub.assignment', 'assignment')
      .innerJoinAndSelect('assignment.classLevel', 'assClass')
      .innerJoinAndSelect('assignment.topic', 'topic')
      .innerJoinAndSelect('topic.subjectCatalog', 'catalog')
      .innerJoin('catalog.school', 'catalogSchool')
      .leftJoinAndSelect('topic.academicTerm', 'topicTerm')
      .innerJoinAndSelect('sub.student', 'student')
      .where('assClass.id = :classLevelId', { classLevelId })
      .andWhere('catalog.id = :subjectCatalogId', { subjectCatalogId })
      .andWhere('catalogSchool.id = :schoolId', { schoolId })
      .andWhere('sub.score IS NOT NULL')
      .andWhere('assignment.maxScore > 0')
      .getMany();

    const subjectName = allSubs[0]?.assignment.topic.subjectCatalog.name ?? '';

    const termSubs = allSubs.filter(
      (sub) => sub.assignment.topic.academicTerm?.id === academicTermId,
    );

    const asOfDateKey = filters.aggregatedAsOf
      ? this.parseAggregatedAsOfDate(filters.aggregatedAsOf)
      : null;
    if (filters.aggregatedAsOf && !asOfDateKey) {
      throw new BadRequestException(
        'aggregatedAsOf must be a valid date (YYYY-MM-DD)',
      );
    }

    const includedSubs = asOfDateKey
      ? termSubs.filter((sub) => this.gradedDateKey(sub) <= asOfDateKey)
      : termSubs;

    let latestGradedAt: string | null = null;
    for (const sub of includedSubs) {
      const gradedAt = this.submissionGradedAt(sub).toISOString();
      if (!latestGradedAt || gradedAt > latestGradedAt) {
        latestGradedAt = gradedAt;
      }
    }

    // Aggregate per-student point-weighted average
    const studentScoreMap = new Map<
      string,
      Array<{ score: number; maxScore: number }>
    >();
    for (const sub of includedSubs) {
      const pair = {
        score: Number(sub.score),
        maxScore: Number(sub.assignment.maxScore),
      };
      const arr = studentScoreMap.get(sub.student.id) ?? [];
      arr.push(pair);
      studentScoreMap.set(sub.student.id, arr);
    }

    type Entry = {
      studentId: string;
      studentName: string;
      avgScore: number | null;
    };

    const allEntries: Entry[] = classLevel.students.map((s) => {
      const scorePairs = studentScoreMap.get(s.id);
      const avg = this.weightedAveragePercent(scorePairs ?? []);
      return {
        studentId: s.id,
        studentName: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim(),
        avgScore: avg,
      };
    });

    const withScores = allEntries
      .filter((e) => e.avgScore !== null)
      .sort((a, b) => b.avgScore! - a.avgScore!);
    const withoutScores = allEntries.filter((e) => e.avgScore === null);

    const total = withScores.length;
    type RankedEntry = Entry & { rank: number; cluster: ClusterName | null };

    const ranked: RankedEntry[] = [
      ...withScores.map((e, idx) => ({
        ...e,
        rank: idx + 1,
        cluster: this.assignClusterByScore(e.avgScore!, gradingBands),
      })),
      ...withoutScores.map((e, idx) => ({
        ...e,
        rank: total + idx + 1,
        cluster: null as ClusterName | null,
      })),
    ];

    // Summary stats (scored students only)
    const sortedScores = withScores
      .map((e) => e.avgScore!)
      .sort((a, b) => a - b);
    const classAverage = sortedScores.length
      ? this.roundPercent(
          sortedScores.reduce((a, b) => a + b, 0) / sortedScores.length,
        )
      : null;
    const medianScore = this.computeMedian(sortedScores);
    const highestScore = sortedScores.length
      ? sortedScores[sortedScores.length - 1]
      : null;
    const lowestScore = sortedScores.length ? sortedScores[0] : null;

    // Cluster distribution
    const clusterDistribution = {
      belowExpectations: 0,
      developing: 0,
      onTrack: 0,
      meetingExpectations: 0,
    };
    for (const r of ranked) {
      if (r.cluster === 'Below Expectations')
        clusterDistribution.belowExpectations++;
      else if (r.cluster === 'Developing') clusterDistribution.developing++;
      else if (r.cluster === 'On Track') clusterDistribution.onTrack++;
      else if (r.cluster === 'Meeting Expectations')
        clusterDistribution.meetingExpectations++;
    }

    // Apply optional filters
    let result = ranked;
    if (filters.cluster) {
      result = result.filter((r) => r.cluster === filters.cluster);
    }
    if (filters.scoreRangeMin !== undefined) {
      result = result.filter(
        (r) => r.avgScore !== null && r.avgScore >= filters.scoreRangeMin!,
      );
    }
    if (filters.scoreRangeMax !== undefined) {
      result = result.filter(
        (r) => r.avgScore !== null && r.avgScore <= filters.scoreRangeMax!,
      );
    }

    return {
      classLevel: { id: classLevel.id, name: classLevel.name },
      academicTerm: { id: termEntity.id, termName: termEntity.termName },
      subject: { id: subjectCatalogId, name: subjectName },
      aggregation: {
        asOfDate: asOfDateKey ?? '',
        latestGradedAt,
        gradedAssignmentsCount: includedSubs.length,
      },
      summary: {
        totalStudents: classLevel.students.length,
        classAverage,
        medianScore,
        highestScore,
        lowestScore,
      },
      clusterDistribution,
      students: result.map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        classLevelName: classLevel.name,
        subjectName,
        aggregatedScore: r.avgScore,
        rank: r.rank,
        cluster: r.cluster,
      })),
    };
  }

  // ─── Student topic breakdown (Screen 2 detail) ──────────────────────────────

  async getStudentTopicPerformance(
    admin: SchoolAdmin,
    studentId: string,
    academicTermId: string,
    subjectCatalogId: string,
  ): Promise<StudentTopicPerformanceResponse> {
    await this.ensureAdminCanAccessStudent(admin, studentId);
    return this.buildStudentTopicPerformance(
      admin.school.id,
      studentId,
      academicTermId,
      subjectCatalogId,
    );
  }

  async getStudentTopicPerformanceForTeacher(
    teacher: Teacher,
    studentId: string,
    academicTermId: string,
    subjectCatalogId: string,
  ): Promise<StudentTopicPerformanceResponse> {
    await this.ensureTeacherCanAccessTopicPerformance(
      teacher,
      studentId,
      subjectCatalogId,
    );
    return this.buildStudentTopicPerformance(
      teacher.school.id,
      studentId,
      academicTermId,
      subjectCatalogId,
    );
  }

  private async buildStudentTopicPerformance(
    schoolId: string,
    studentId: string,
    academicTermId: string,
    subjectCatalogId: string,
  ): Promise<StudentTopicPerformanceResponse> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['classLevels'],
    });
    if (!student) throw new NotFoundException('Student not found');

    const termEntity = await this.academicTermRepository.findOne({
      where: { id: academicTermId },
      relations: ['academicCalendar'],
    });
    if (!termEntity) throw new NotFoundException('Academic term not found');

    const studentClassIds = student.classLevels.map((cl) => cl.id);

    const emptyResponse = (
      classLevelName: string,
    ): StudentTopicPerformanceResponse => ({
      student: {
        id: student.id,
        name: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim(),
        classLevelName,
        overallAveragePercent: null,
        cluster: null,
      },
      academicTerm: { id: termEntity.id, termName: termEntity.termName },
      subject: { id: subjectCatalogId, name: '' },
      topics: [],
    });

    if (!studentClassIds.length) return emptyResponse('');

    const gradingBands = await this.loadGradingBands(schoolId);

    // Fetch all submissions for the student's class(es) for this subject/term
    const allSubs = await this.submissionRepository
      .createQueryBuilder('sub')
      .innerJoinAndSelect('sub.assignment', 'assignment')
      .innerJoinAndSelect('assignment.topic', 'topic')
      .innerJoinAndSelect('topic.subjectCatalog', 'catalog')
      .innerJoin('catalog.school', 'catalogSchool')
      .leftJoinAndSelect('topic.academicTerm', 'topicTerm')
      .innerJoinAndSelect('assignment.classLevel', 'assClass')
      .innerJoinAndSelect('sub.student', 'subStudent')
      .where('assClass.id IN (:...classLevelIds)', {
        classLevelIds: studentClassIds,
      })
      .andWhere('catalog.id = :subjectCatalogId', { subjectCatalogId })
      .andWhere('catalogSchool.id = :schoolId', { schoolId })
      .andWhere('sub.score IS NOT NULL')
      .andWhere('assignment.maxScore > 0')
      .getMany();

    const termSubs = allSubs.filter(
      (sub) => sub.assignment.topic.academicTerm?.id === academicTermId,
    );

    const subjectName = termSubs[0]?.assignment.topic.subjectCatalog.name ?? '';
    const classLevelName =
      termSubs.find((s) => s.student.id === studentId)?.assignment.classLevel
        .name ?? '';

    if (!termSubs.length) return emptyResponse(classLevelName);

    // Group by topic → per-student averages
    type TopicAccum = {
      topicName: string;
      assignmentIds: Set<string>;
      perStudentScores: Map<string, Array<{ score: number; maxScore: number }>>;
    };

    const topicMap = new Map<string, TopicAccum>();

    for (const sub of termSubs) {
      const topicId = sub.assignment.topic.id;
      let td = topicMap.get(topicId);
      if (!td) {
        td = {
          topicName: sub.assignment.topic.name,
          assignmentIds: new Set(),
          perStudentScores: new Map(),
        };
        topicMap.set(topicId, td);
      }
      td.assignmentIds.add(sub.assignment.id);
      const pair = {
        score: Number(sub.score),
        maxScore: Number(sub.assignment.maxScore),
      };
      const arr = td.perStudentScores.get(sub.student.id) ?? [];
      arr.push(pair);
      td.perStudentScores.set(sub.student.id, arr);
    }

    const topics: StudentTopicPerformanceResponse['topics'] = [];

    for (const [topicId, td] of topicMap) {
      // Per-student point-weighted averages for this topic
      const studentTopicAvgs: number[] = [];
      let thisStudentAvg: number | null = null;

      for (const [sid, scorePairs] of td.perStudentScores) {
        const avg = this.weightedAveragePercent(scorePairs);
        if (avg === null) continue;
        studentTopicAvgs.push(avg);
        if (sid === studentId) thisStudentAvg = avg;
      }

      const sorted = [...studentTopicAvgs].sort((a, b) => a - b);
      const classAverage = sorted.length
        ? this.roundPercent(sorted.reduce((a, b) => a + b, 0) / sorted.length)
        : null;
      const median = this.computeMedian(sorted);
      const range = sorted.length
        ? { min: sorted[0], max: sorted[sorted.length - 1] }
        : { min: null, max: null };

      let cluster: ClusterName | null = null;
      if (thisStudentAvg !== null) {
        cluster = this.assignClusterByScore(thisStudentAvg, gradingBands);
      }

      topics.push({
        topicId,
        topicName: td.topicName,
        studentAggregatedScore: thisStudentAvg,
        classAverage,
        range,
        median,
        testCount: td.assignmentIds.size,
        cluster,
      });
    }

    topics.sort((a, b) => a.topicName.localeCompare(b.topicName));

    const studentSubs = termSubs.filter((s) => s.student.id === studentId);
    const overallAvg = this.weightedAveragePercent(
      studentSubs.map((s) => ({
        score: Number(s.score),
        maxScore: Number(s.assignment.maxScore),
      })),
    );
    const overallCluster =
      overallAvg !== null
        ? this.assignClusterByScore(overallAvg, gradingBands)
        : null;

    return {
      student: {
        id: student.id,
        name: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim(),
        classLevelName,
        overallAveragePercent: overallAvg,
        cluster: overallCluster,
      },
      academicTerm: { id: termEntity.id, termName: termEntity.termName },
      subject: { id: subjectCatalogId, name: subjectName },
      topics,
    };
  }
}
