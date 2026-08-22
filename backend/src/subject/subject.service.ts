import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Subject } from './subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { Teacher } from '../teacher/teacher.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { SubjectCatalog } from './subject-catalog.entity';
import { School } from '../school/school.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { StudentGrade } from './student-grade.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { AcademicCalendar } from '../academic-calendar/entitites/academic-calendar.entity';
import { Student } from '../student/student.entity';
import { Parent } from '../parent/parent.entity';
import { GradingSystem } from '../grading-system/grading-system.entity';
import { GradingScheme } from '../grading-scheme/grading-scheme.entity';
import { GradingSchemeBand } from '../grading-scheme/grading-scheme-band.entity';
import { SubmitGradesDto } from './dto/submit-grades.dto';
import { StudentTermRemark } from './student-term-remark.entity';
import { QueryString } from 'src/common/api-features/api-features';
import { ClassLevelResultApproval } from 'src/class-level/class-level-result-approval.entity';
import { GradeSubmissionHistory } from 'src/class-level/grade-submission-history.entity';
import { isSchoolAdminOrClassTeacher } from '../common/utils/authUtil';
import {
  applyScoreRounding,
  isPublishedResultStatus,
  isStudentParentRestrictedRole,
  resolveGradeFromBands,
  ResolvedGradingScheme,
} from './grading-resolution.util';
import { NotificationService } from 'src/notification/notification.service';
import {
  NotificationRecipientRole,
  NotificationType,
} from 'src/notification/notification.entity';
import { Assignment } from '../teacher/entities/assignment.entity';
import { AssignmentSubmission } from '../student/entities/assignment-submission.entity';
import { TenantContextService } from 'src/common/tenant/tenant-context.service';
import { TenantScopedRepositoryService } from 'src/common/tenant/tenant-scoped-repository.service';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(SubjectCatalog)
    private subjectCatalogRepository: Repository<SubjectCatalog>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(StudentGrade)
    private studentGradeRepository: Repository<StudentGrade>,
    @InjectRepository(AcademicTerm)
    private academicTermRepository: Repository<AcademicTerm>,
    @InjectRepository(AcademicCalendar)
    private academicCalendarRepository: Repository<AcademicCalendar>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(GradingSystem)
    private gradingSystemRepository: Repository<GradingSystem>,
    @InjectRepository(GradingScheme)
    private gradingSchemeRepository: Repository<GradingScheme>,
    @InjectRepository(GradingSchemeBand)
    private gradingSchemeBandRepository: Repository<GradingSchemeBand>,
    @InjectRepository(StudentTermRemark)
    private remarkRepository: Repository<StudentTermRemark>,
    @InjectRepository(ClassLevelResultApproval)
    private classLevelResultApprovalRepository: Repository<ClassLevelResultApproval>,
    @InjectRepository(GradeSubmissionHistory)
    private gradeSubmissionHistoryRepository: Repository<GradeSubmissionHistory>,
    private readonly notificationService: NotificationService,
    private readonly tenantContext: TenantContextService,
    private readonly tenantScopedRepository: TenantScopedRepositoryService,
  ) {}

  async create(createSubjectDto: CreateSubjectDto, _admin: SchoolAdmin) {
    const { subjectCatalogId, classLevelIds, teacherId } = createSubjectDto;
    const schoolId = this.tenantContext.getTenantIdOrThrow();

    // Validate subject catalog
    const subjectCatalog = await this.subjectCatalogRepository.findOne({
      where: { id: subjectCatalogId },
    });
    if (!subjectCatalog) {
      throw new NotFoundException('Subject catalog entry not found');
    }

    // Validate teacher
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId, school: { id: schoolId } },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Validate admin and school
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Check if subject already exists for (catalog + teacher + school)
    let subject = await this.subjectRepository.findOne({
      where: {
        subjectCatalog: { id: subjectCatalog.id },
        teacher: { id: teacher.id },
        school: { id: school.id },
      },
      relations: ['classLevels'],
    });

    if (!subject) {
      subject = this.subjectRepository.create({
        subjectCatalog,
        teacher,
        school,
        classLevels: [],
      });
    }

    // Fetch class levels
    const classLevels = await Promise.all(
      classLevelIds.map(async (id) => {
        const level = await this.classLevelRepository.findOne({
          where: { id, school: { id: schoolId } },
        });
        if (!level) {
          throw new NotFoundException(`Class level not found: ${id}`);
        }
        return level;
      }),
    );

    subject.classLevels = classLevels;
    const saved = await this.subjectRepository.save(subject);

    return {
      id: saved.id,
      subjectCatalog: {
        id: subjectCatalog.id,
        name: subjectCatalog.name,
      },
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        fullName: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
      },
      classLevels: classLevels.map((level) => ({
        id: level.id,
        name: level.name,
      })),
    };
  }

  async update(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
    _admin: SchoolAdmin,
  ) {
    const schoolId = this.tenantContext.getTenantIdOrThrow();
    const subject = await this.tenantScopedRepository.findOne(
      this.subjectRepository,
      {
        where: { id } as Subject,
        relations: ['classLevels', 'subjectCatalog', 'teacher'],
      },
    );

    if (subject?.school?.id && subject.school.id !== schoolId) {
      throw new NotFoundException('Subject not found');
    }

    if (!subject) throw new NotFoundException('Subject not found');

    if (subject.school?.id !== schoolId) {
      throw new NotFoundException('Subject not found');
    }
 
    if (updateSubjectDto.subjectCatalogId) {
      const subjectCatalog = await this.subjectCatalogRepository.findOne({
        where: { id: updateSubjectDto.subjectCatalogId },
      });
      if (!subjectCatalog)
        throw new NotFoundException('Subject catalog not found');
      subject.subjectCatalog = subjectCatalog;
    }

    if (updateSubjectDto.teacherId) {
      const foundTeacher = await this.teacherRepository.findOne({
        where: { id: updateSubjectDto.teacherId, school: { id: schoolId } },
      });
      if (!foundTeacher) throw new NotFoundException('Teacher not found');
      subject.teacher = foundTeacher;
    }

    if (
      updateSubjectDto.classLevelIds &&
      updateSubjectDto.classLevelIds.length > 0
    ) {
      const classLevels: ClassLevel[] = [];
      for (const classLevelId of updateSubjectDto.classLevelIds) {
        const classLevel = await this.classLevelRepository.findOne({
          where: { id: classLevelId, school: { id: schoolId } },
        });
        if (!classLevel)
          throw new NotFoundException(`Class level not found: ${classLevelId}`);
        classLevels.push(classLevel);
      }
      subject.classLevels = classLevels;
    }

    const saved = await this.subjectRepository.save(subject);

    return {
      id: saved.id,
      subjectCatalog: {
        id: saved.subjectCatalog.id,
        name: saved.subjectCatalog.name,
      },
      teacher: {
        id: saved.teacher.id,
        firstName: saved.teacher.firstName,
        lastName: saved.teacher.lastName,
        fullName: `${saved.teacher.firstName} ${saved.teacher.lastName}`,
        email: saved.teacher.email,
      },
      classLevels: saved.classLevels.map((level) => ({
        id: level.id,
        name: level.name,
      })),
    };
  }

  async remove(id: string, _admin: SchoolAdmin): Promise<void> {
    const schoolId = this.tenantContext.getTenantIdOrThrow();
    const subject = await this.subjectRepository.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['classLevels', 'subjectCatalog', 'teacher'],
    });
    if (!subject) throw new NotFoundException('Subject not found');

    await this.subjectRepository.delete(subject.id);
  }

  async toggleClassResultsApproval(
    classLevelId: string,
    teacher: Teacher,
    action: 'approve' | 'unapprove' = 'approve',
    forceApprove = false,
    academicTermId?: string,
  ) {
    let term: AcademicTerm | null = null;
    if (academicTermId) {
      term = await this.academicTermRepository.findOne({
        where: {
          id: academicTermId,
          academicCalendar: { school: { id: teacher.school.id } },
        },
        relations: ['academicCalendar'],
      });
      if (!term) {
        throw new NotFoundException('Academic term not found');
      }
    } else {
      term = await this.academicTermRepository.findOne({
        where: { academicCalendar: { school: { id: teacher.school.id } } },
        order: { startDate: 'DESC' },
        relations: ['academicCalendar'],
      });
    }
    if (!term) {
      throw new NotFoundException('No academic term found for this school');
    }

    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['students'],
    });
    if (!classLevel) throw new NotFoundException('Class level not found');

    const subjects = await this.subjectRepository.find({
      where: {
        classLevels: { id: classLevelId },
        school: { id: teacher.school.id },
      },
      relations: ['subjectCatalog', 'teacher', 'classLevels'],
    });

    const grades = await this.studentGradeRepository.find({
      where: {
        classLevel: { id: classLevelId },
        academicTerm: { id: term.id },
      },
      relations: [
        'student',
        'subject',
        'subject.subjectCatalog',
        'subject.teacher',
      ],
    });

    const gradeMap = new Map<string, StudentGrade>();
    for (const grade of grades) {
      gradeMap.set(`${grade.student.id}_${grade.subject.id}`, grade);
    }

    const missingGrades: Array<{
      student: { id: string; firstName: string; lastName: string };
      missingSubjects: Array<{
        subjectId: string;
        subjectName: string;
        teacher: { id: string; firstName: string; lastName: string };
      }>;
    }> = [];

    for (const student of classLevel.students) {
      const missingSubjects: {
        subjectId: string;
        subjectName: string;
        teacher: {
          id: string;
          firstName: string;
          lastName: string;
        };
      }[] = [];
      for (const subject of subjects) {
        if (!gradeMap.has(`${student.id}_${subject.id}`)) {
          missingSubjects.push({
            subjectId: subject.id,
            subjectName: subject.subjectCatalog.name,
            teacher: {
              id: subject.teacher.id,
              firstName: subject.teacher.firstName,
              lastName: subject.teacher.lastName,
            },
          });
        }
      }
      if (missingSubjects.length) {
        missingGrades.push({
          student: {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
          },
          missingSubjects,
        });
      }
    }

    // Check if school admin has already approved - if so, class teacher cannot modify
    let approval = await this.classLevelResultApprovalRepository.findOne({
      where: {
        classLevel: { id: classLevelId },
        academicTerm: { id: term.id },
      },
    });

    if (approval?.schoolAdminApproved || approval?.resultStatus === 'published') {
      throw new ForbiddenException(
        'The results for this class and academic term have already been approved by class teacher. Please contact your administrator if you need them to be unlocked.',
      );
    }

    if (
      action !== 'unapprove' &&
      approval?.resultStatus &&
      ['submitted', 'approved', 'published'].includes(approval.resultStatus)
    ) {
      throw new ForbiddenException(
        'The results for this class and academic term have already been submitted. Please contact your administrator if you need them to be unlocked.',
      );
    }

    // For unapprove action, skip missing grades validation
    if (action === 'approve' && missingGrades.length > 0 && !forceApprove) {
      return {
        message: 'Some students have missing grades. Approval not completed.',
        approved: false,
        missingGrades,
      };
    }

    if (!approval) {
      approval = this.classLevelResultApprovalRepository.create({
        classLevel,
        academicTerm: term,
        approved: action === 'approve',
        approvedAt: action === 'approve' ? new Date() : undefined,
        schoolAdminApproved: false,
        schoolAdminApprovedAt: undefined,
        approvedBySchoolAdmin: undefined,
        resultStatus: action === 'approve' ? 'submitted' : 'draft',
      });
    } else {
      approval.approved = action === 'approve';
      approval.approvedAt = action === 'approve' ? new Date() : undefined;
      approval.resultStatus =
        action === 'approve'
          ? 'submitted'
          : approval.resultStatus === 'returned'
            ? 'returned'
            : 'draft';
    }
    await this.classLevelResultApprovalRepository.save(approval);

    if (action === 'unapprove') {
      await this.reopenStudentGradesForClassTerm(classLevelId, term.id);
    }

    if (action === 'approve') {
      await this.recordGradeSubmissionHistory({
        classLevel,
        academicTerm: term,
        action: 'submitted',
        performedById: teacher.id,
        performedByName: `${teacher.firstName} ${teacher.lastName}`,
        performedByRole: 'Teacher',
      });
      try {
        await this.notificationService.create({
          title: 'Class Results Approved',
          message: `Teacher ${teacher.firstName} ${teacher.lastName} has approved results for ${classLevel.name} for academic term ${term.termName}.`,
          schoolId: teacher.school.id,
          type: NotificationType.ClassTeacherResultSubmission,
        });
      } catch {
        // Admin inbox should not block teacher notifications.
      }

      const otherSubjectTeachers = subjects
        .map((subject) => subject.teacher)
        .filter(
          (assignedTeacher): assignedTeacher is Teacher =>
            !!assignedTeacher?.id && assignedTeacher.id !== teacher.id,
        )
        .map((assignedTeacher) => ({
          id: assignedTeacher.id,
          role: NotificationRecipientRole.Teacher,
        }));

      await this.notificationService.createForRecipients({
        schoolId: teacher.school.id,
        type: NotificationType.ClassResultsSubmitted,
        title: 'Class results submitted',
        message: `${classLevel.name} results submitted for ${term.termName}`,
        recipients: otherSubjectTeachers,
      });
    }

    return {
      message:
        action === 'approve'
          ? 'Class level results approved for this term.'
          : 'Class level results unapproved for this term.',
      isApproved: approval.approved,
      approvedAt: approval.approvedAt,
      schoolAdminApproved: approval.schoolAdminApproved,
      schoolAdminApprovedAt: approval.schoolAdminApprovedAt,
      term: term.termName,
      missingGrades: action === 'approve' ? missingGrades : [],
    };
  }

  async getClassResultsApprovalStatus(
    classLevelId: string,
    user: Teacher | SchoolAdmin,
    academicTermId?: string,
  ) {
    let term: AcademicTerm | null = null;

    if (academicTermId) {
      term = await this.academicTermRepository.findOne({
        where: {
          id: academicTermId,
          academicCalendar: { school: { id: user.school.id } },
        },
        relations: ['academicCalendar'],
      });
      if (!term) {
        throw new NotFoundException('Academic term not found');
      }
    } else {
      term = await this.academicTermRepository.findOne({
        where: { academicCalendar: { school: { id: user.school.id } } },
        order: { startDate: 'DESC' },
        relations: ['academicCalendar'],
      });
    }

    if (!term) {
      throw new NotFoundException('No academic term found for this school');
    }

    const approval = await this.classLevelResultApprovalRepository.findOne({
      where: {
        classLevel: { id: classLevelId },
        academicTerm: { id: term.id },
      },
    });

    return {
      isApproved: approval?.approved || false,
      approvedAt: approval?.approvedAt,
      schoolAdminApproved: approval?.schoolAdminApproved || false,
      schoolAdminApprovedAt: approval?.schoolAdminApprovedAt,
      approvedBySchoolAdmin: approval?.approvedBySchoolAdmin,
      resultStatus: approval?.resultStatus ?? 'draft',
      returnNote: approval?.returnNote ?? null,
      publishedAt: approval?.publishedAt ?? null,
      term: term.termName,
      termId: term.id,
    };
  }

  async toggleSchoolAdminApproval(
    classLevelId: string,
    schoolAdmin: SchoolAdmin,
    action: 'approve' | 'unapprove' = 'approve',
    academicTermId?: string,
  ) {
    let term: AcademicTerm | null = null;
    if (academicTermId) {
      term = await this.academicTermRepository.findOne({
        where: {
          id: academicTermId,
          academicCalendar: { school: { id: schoolAdmin.school.id } },
        },
        relations: ['academicCalendar'],
      });
      if (!term) {
        throw new NotFoundException('Academic term not found');
      }
    } else {
      term = await this.academicTermRepository.findOne({
        where: { academicCalendar: { school: { id: schoolAdmin.school.id } } },
        order: { startDate: 'DESC' },
        relations: ['academicCalendar'],
      });
    }
    if (!term) {
      throw new NotFoundException('No academic term found for this school');
    }

    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['students', 'classTeacher'],
    });
    if (!classLevel) throw new NotFoundException('Class level not found');

    let approval = await this.classLevelResultApprovalRepository.findOne({
      where: {
        classLevel: { id: classLevelId },
        academicTerm: { id: term.id },
      },
    });

    if (!approval) {
      approval = this.classLevelResultApprovalRepository.create({
        classLevel,
        academicTerm: term,
        approved: false,
        approvedAt: undefined,
        schoolAdminApproved: action === 'approve',
        schoolAdminApprovedAt: action === 'approve' ? new Date() : undefined,
        approvedBySchoolAdmin: action === 'approve' ? schoolAdmin : undefined,
        resultStatus: action === 'approve' ? 'published' : 'draft',
        publishedAt: action === 'approve' ? new Date() : null,
        publishedById: action === 'approve' ? schoolAdmin.id : null,
        publishedByName: action === 'approve'
          ? `${schoolAdmin.firstName} ${schoolAdmin.lastName}`
          : null,
      });
    } else {
      approval.schoolAdminApproved = action === 'approve';
      approval.schoolAdminApprovedAt =
        action === 'approve' ? new Date() : undefined;
      approval.approvedBySchoolAdmin =
        action === 'approve' ? schoolAdmin : undefined;
      approval.resultStatus =
        action === 'approve'
          ? 'published'
          : 'draft';
      approval.publishedAt = action === 'approve' ? new Date() : null;
      approval.publishedById = action === 'approve' ? schoolAdmin.id : null;
      approval.publishedByName =
        action === 'approve'
          ? `${schoolAdmin.firstName} ${schoolAdmin.lastName}`
          : null;
      if (action === 'unapprove') {
        approval.approved = false;
        approval.approvedAt = undefined;
        approval.resultStatus = 'draft';
        approval.returnNote = null;
        approval.returnedAt = null;
        approval.returnedById = null;
        approval.returnedByName = null;
        approval.adminApprovedAt = null;
        approval.adminApprovedById = null;
        approval.adminApprovedByName = null;
      }
    }

    await this.classLevelResultApprovalRepository.save(approval);

    if (action === 'unapprove') {
      await this.reopenStudentGradesForClassTerm(classLevelId, term.id);
    }

    if (action === 'approve') {
      await this.recordGradeSubmissionHistory({
        classLevel,
        academicTerm: term,
        action: 'published',
        performedById: schoolAdmin.id,
        performedByName: `${schoolAdmin.firstName} ${schoolAdmin.lastName}`,
        performedByRole: 'School Admin',
      });
    } else {
      await this.recordGradeSubmissionHistory({
        classLevel,
        academicTerm: term,
        action: 'unlocked',
        performedById: schoolAdmin.id,
        performedByName: `${schoolAdmin.firstName} ${schoolAdmin.lastName}`,
        performedByRole: 'School Admin',
      });
    }

    const subjects = await this.subjectRepository.find({
      where: {
        classLevels: { id: classLevelId },
        school: { id: schoolAdmin.school.id },
      },
      relations: ['teacher'],
    });

    const teacherRecipients = [
      ...(classLevel.classTeacher?.id
        ? [
            {
              id: classLevel.classTeacher.id,
              role: NotificationRecipientRole.Teacher,
            },
          ]
        : []),
      ...subjects
        .filter((subject) => !!subject.teacher?.id)
        .map((subject) => ({
          id: subject.teacher.id,
          role: NotificationRecipientRole.Teacher,
        })),
    ];

    if (action === 'approve') {
      await this.notificationService.createForRecipients({
        schoolId: schoolAdmin.school.id,
        type: NotificationType.ResultsReleased,
        title: 'Results locked',
        message: `${classLevel.name} results locked for ${term.termName}`,
        recipients: teacherRecipients,
      });

      const studentRecipients = (classLevel.students ?? [])
        .filter((student) => !student.isArchived)
        .map((student) => ({
          id: student.id,
          role: NotificationRecipientRole.Student,
        }));

      await this.notificationService.createForRecipients({
        schoolId: schoolAdmin.school.id,
        type: NotificationType.ResultsReleased,
        title: 'Results available',
        message: `${term.termName} results are now available`,
        recipients: studentRecipients,
      });
    } else {
      await this.notificationService.createForRecipients({
        schoolId: schoolAdmin.school.id,
        type: NotificationType.ResultsUnlocked,
        title: 'Results unlocked',
        message: `${classLevel.name} results unlocked for ${term.termName}`,
        recipients: teacherRecipients,
      });
    }

    return {
      message:
        action === 'approve'
          ? 'Class level results approved by school admin.'
          : 'Class level results unapproved by school admin.',
      isApproved: approval.approved,
      approvedAt: approval.approvedAt,
      schoolAdminApproved: approval.schoolAdminApproved,
      schoolAdminApprovedAt: approval.schoolAdminApprovedAt,
      approvedBySchoolAdmin: approval.approvedBySchoolAdmin,
      term: term.termName,
    };
  }

  async getAllClassResultsApprovalStatus(schoolAdmin: SchoolAdmin) {
    const latestTerm = await this.academicTermRepository.findOne({
      where: { academicCalendar: { school: { id: schoolAdmin.school.id } } },
      order: { startDate: 'DESC' },
      relations: ['academicCalendar'],
    });
    if (!latestTerm)
      throw new NotFoundException('No academic term found for this school');

    const approvals = await this.classLevelResultApprovalRepository.find({
      where: {
        academicTerm: { id: latestTerm.id },
        classLevel: { school: { id: schoolAdmin.school.id } },
      },
      relations: ['classLevel', 'approvedBySchoolAdmin'],
    });

    return {
      term: latestTerm.termName,
      termId: latestTerm.id,
      approvals: approvals.map((approval) => ({
        classLevelId: approval.classLevel.id,
        className: approval.classLevel.name,
        teacherApproved: approval.approved,
        teacherApprovedAt: approval.approvedAt,
        schoolAdminApproved: approval.schoolAdminApproved,
        schoolAdminApprovedAt: approval.schoolAdminApprovedAt,
        resultStatus: approval.resultStatus ?? 'draft',
        returnNote: approval.returnNote ?? null,
        publishedAt: approval.publishedAt ?? null,
        approvedBySchoolAdmin: approval.approvedBySchoolAdmin
          ? {
              id: approval.approvedBySchoolAdmin.id,
              firstName: approval.approvedBySchoolAdmin.firstName,
              lastName: approval.approvedBySchoolAdmin.lastName,
            }
          : null,
      })),
    };
  }

  async getClassesForTeacher(teacherId: string, query?: QueryString) {
    const subjects = await this.subjectRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['classLevels', 'subjectCatalog'],
    });

    if (subjects.length === 0) {
      return [];
    }

    const classLevelIds = [
      ...new Set(subjects.flatMap((s) => s.classLevels.map((l) => l.id))),
    ];

    const counts = await this.classLevelRepository
      .createQueryBuilder('classLevel')
      .leftJoin('classLevel.students', 'student')
      .where('classLevel.id IN (:...ids)', { ids: classLevelIds })
      .select('classLevel.id', 'classLevelId')
      .addSelect('COUNT(DISTINCT student.id)', 'count')
      .groupBy('classLevel.id')
      .getRawMany<{ classLevelId: string; count: string }>();

    const countMap = new Map(
      counts.map((c) => [c.classLevelId, parseInt(c.count, 10)]),
    );

    const classLevelMap = new Map<
      string,
      {
        classLevel: {
          id: string;
          name: string;
          description?: string;
          studentCount: number;
        };
        subjects: { id: string; name: string }[];
      }
    >();

    for (const subject of subjects) {
      for (const level of subject.classLevels) {
        if (!classLevelMap.has(level.id)) {
          classLevelMap.set(level.id, {
            classLevel: {
              id: level.id,
              name: level.name,
              description: level.description,
              studentCount: countMap.get(level.id) || 0,
            },
            subjects: [],
          });
        }

        const classLevelData = classLevelMap.get(level.id)!;
        classLevelData.subjects.push({
          id: subject.id,
          name: subject.subjectCatalog.name,
        });
      }
    }

    // 5. Convert map → array
    let results = Array.from(classLevelMap.values());

    // 6. Apply search filter
    if (query?.search) {
      const searchTerm = query.search.toLowerCase();
      results = results.filter(
        (item) =>
          item.classLevel.name.toLowerCase().includes(searchTerm) ||
          item.classLevel.description?.toLowerCase().includes(searchTerm),
      );
    }

    // 7. Apply pagination
    if (query) {
      const page = parseInt(query.page!) || 1;
      const limit = parseInt(query.limit!) || 10;
      const skip = (page - 1) * limit;
      results = results.slice(skip, skip + limit);
    }

    return results;
  }

  private async calculateAggregatedAssignmentScores(
    classLevelId: string,
    subjectCatalogId: string,
    academicTermId: string,
    studentIds: string[],
    classScoreMax: number,
  ): Promise<Map<string, number>> {
    const manager = this.studentGradeRepository.manager;
    const assignmentRepository = manager.getRepository(Assignment);
    const submissionRepository = manager.getRepository(AssignmentSubmission);

    const academicTerm = await this.academicTermRepository.findOne({
      where: { id: academicTermId },
    });

    if (!academicTerm) {
      return new Map();
    }

    const termStartDate = new Date(academicTerm.startDate);
    const termEndDate = new Date(academicTerm.endDate);
    termEndDate.setHours(23, 59, 59, 999);

    const allAssignments = await assignmentRepository.find({
      where: {
        classLevel: { id: classLevelId },
        state: 'published',
        topic: {
          subjectCatalog: { id: subjectCatalogId },
        },
      },
      relations: ['topic', 'topic.subjectCatalog'],
    });

    const termAssignments = allAssignments.filter((assignment) => {
      const dueDate = new Date(assignment.dueDate);
      return dueDate >= termStartDate && dueDate <= termEndDate;
    });

    const aggregatedScoresMap = new Map<string, number>();

    if (termAssignments.length === 0) {
      return aggregatedScoresMap;
    }

    const assignmentIds = termAssignments.map((a) => a.id);
    const allSubmissions = await submissionRepository.find({
      where: {
        assignment: { id: In(assignmentIds) },
        student: { id: In(studentIds) },
      },
      relations: ['assignment', 'student'],
    });

    studentIds.forEach((studentId) => {
      const studentSubmissions = allSubmissions.filter(
        (s) => s.student.id === studentId,
      );

      let totalScore = 0;
      let totalMaxScore = 0;
      let hasGradedAssignments = false;

      termAssignments.forEach((assignment) => {
        totalMaxScore += assignment.maxScore;
        const submission = studentSubmissions.find(
          (s) => s.assignment.id === assignment.id,
        );
        if (submission && submission.score !== null) {
          totalScore += submission.score;
          hasGradedAssignments = true;
        }
      });

      if (hasGradedAssignments && totalMaxScore > 0) {
        const averagePercentage = (totalScore / totalMaxScore) * 100;
        const classScore = (averagePercentage / 100) * classScoreMax;
        aggregatedScoresMap.set(studentId, Math.round(classScore * 100) / 100);
      }
    });

    return aggregatedScoresMap;
  }

  async getStudentsForGrading(
    classLevelId: string,
    subjectId: string,
    academicTermId?: string,
  ) {
    if (!classLevelId) {
      throw new BadRequestException('classLevel is required');
    }
    // Fetch class level with students and their profiles
    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['students', 'students.profile'],
    });

    if (!classLevel) throw new NotFoundException('Class level not found');

    // Fetch subject with catalog to get subject name

    if (!subjectId) {
      throw new BadRequestException('subject is required');
    }
    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId },
      relations: ['subjectCatalog', 'school'],
    });
    if (!subject) throw new NotFoundException('Subject not found');

    // Fetch academic term and calendar
    const academicTerm = await this.academicTermRepository.findOne({
      where: { id: academicTermId },
      relations: ['academicCalendar'],
    });
    if (!academicTerm) throw new NotFoundException('Academic term not found');

    // Fetch existing grades for this subject/class/term
    const grades = await this.studentGradeRepository.find({
      where: {
        subject: { id: subjectId },
        classLevel: { id: classLevelId },
        academicTerm: { id: academicTermId },
      },
      relations: ['student'],
    });

    const gradeMap = new Map(grades.map((g) => [g.student.id, g]));

    const approval = await this.classLevelResultApprovalRepository.findOne({
      where: {
        classLevel: { id: classLevelId },
        academicTerm: { id: academicTermId },
      },
    });

    const classScoreMax = subject.school?.classScorePercentage || 30;
    const examScoreMax = subject.school?.examScorePercentage || 70;
    const resolvedScheme = await this.resolveGradingScheme(
      subject.school.id,
      classLevelId,
      academicTermId,
    );
    const gradingBands = resolvedScheme.bands.map((band) => ({
      code: band.code,
      label: band.label,
      minScore: band.minScore,
      maxScore: band.maxScore,
    }));
    const studentIds = classLevel.students.map((s) => s.id);
    const aggregatedScoresMap = await this.calculateAggregatedAssignmentScores(
      classLevelId,
      subject.subjectCatalog.id,
      academicTermId as string,
      studentIds,
      classScoreMax,
    );

    const response = {
      metadata: {
        subject: {
          id: subject.id,
          name: subject.subjectCatalog.name,
        },
        classLevel: {
          id: classLevel.id,
          name: classLevel.name,
        },
        academicTerm: {
          id: academicTerm.id,
          name: academicTerm.termName,
        },
        academicCalendar: {
          id: academicTerm.academicCalendar.id,
          name: academicTerm.academicCalendar.name,
        },
        isApproved: approval?.approved || false,
        approvedAt: approval?.approvedAt,
        schoolAdminApproved: approval?.schoolAdminApproved || false,
        schoolAdminApprovedAt: approval?.schoolAdminApprovedAt,
        resultStatus: approval?.resultStatus ?? 'draft',
        returnNote: approval?.returnNote ?? null,
        allowManualOverride: resolvedScheme.allowManualOverride,
        passMark: resolvedScheme.passMark,
        classScoreMax,
        examScoreMax,
        gradingBands,
      },
      students: classLevel.students.map((student) => {
        const existingGrade = gradeMap.get(student.id);
        const aggregatedScore = aggregatedScoresMap.get(student.id);
        const classScore =
          existingGrade?.classScore ??
          (aggregatedScore !== undefined ? aggregatedScore : null);
        const examScore = existingGrade?.examScore ?? null;
        const totalScore =
          classScore !== null && examScore !== null
            ? classScore + examScore
            : existingGrade?.totalScore ?? null;
        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          studentId: student.studentId,
          isArchived: student.isArchived,
          archivedAt: student.isArchived ? student.updatedAt : null,
          hasGradeRecord: Boolean(existingGrade),
          scores: {
            classScore,
            examScore,
            totalScore,
            grade: existingGrade?.grade ?? null,
            gradeLabel: existingGrade?.gradeLabel ?? null,
          },
          feedback: existingGrade?.feedback ?? null,
          status: existingGrade?.status ?? null,
        };
      }),
    };

    return response;
  }

  async submitTermRemarks(
    teacherId: string,
    data: {
      studentId: string;
      academicTermId: string;
      remarks: string;
    },
  ) {
    const [student, teacher, academicTerm] = await Promise.all([
      this.studentRepository.findOne({ where: { id: data.studentId } }),
      this.teacherRepository.findOne({ where: { id: teacherId } }),
      this.academicTermRepository.findOne({
        where: { id: data.academicTermId },
      }),
    ]);

    if (!student) throw new NotFoundException('Student not found');
    if (!teacher) throw new NotFoundException('Teacher not found');
    if (!academicTerm) throw new NotFoundException('Academic term not found');

    // Find existing remark or create new one
    let remark = await this.remarkRepository.findOne({
      where: {
        student: { id: student.id },
        academicTerm: { id: academicTerm.id },
      },
    });

    if (!remark) {
      remark = this.remarkRepository.create({
        student,
        teacher,
        academicTerm,
      });
    }

    remark.remarks = data.remarks;
    return this.remarkRepository.save(remark);
  }

  async getStudentResults(
    studentId: string,
    academicCalendarId: string,
    user: SchoolAdmin | Teacher | Student | Parent,
  ) {
    const calendar = await this.academicCalendarRepository.findOne({
      where: { id: academicCalendarId },
      relations: ['terms', 'school'],
    });

    if (!calendar) {
      throw new NotFoundException('Academic calendar not found');
    }

    const sortedTerms = [...calendar.terms].sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const studentGradesForClassLevel =
      await this.studentGradeRepository.findOne({
        where: { student: { id: studentId } },
        relations: ['classLevel'],
      });

    if (!studentGradesForClassLevel?.classLevel) {
      return {
        studentInfo: { academicYear: calendar.name, class: null },
        terms: [],
        gradingLegend: [],
      };
    }

    const studentClassLevelId = studentGradesForClassLevel.classLevel.id;
    const restrictedViewer = isStudentParentRestrictedRole(user.role?.label);
    const authorizedToView = await isSchoolAdminOrClassTeacher(
      user,
      studentClassLevelId,
      this.classLevelRepository,
    );

    const resolvedScheme = await this.resolveGradingScheme(
      calendar.school.id,
      studentClassLevelId,
    );

    const grades = await this.studentGradeRepository.find({
      where: {
        student: { id: studentId },
        academicCalendar: { id: academicCalendarId },
      },
      relations: [
        'subject',
        'subject.subjectCatalog',
        'academicTerm',
        'classLevel',
      ],
    });

    const termResults = await Promise.all(
      sortedTerms.map(async (term) => {
        const approval = await this.classLevelResultApprovalRepository.findOne({
          where: {
            classLevel: { id: studentClassLevelId },
            academicTerm: { id: term.id },
          },
        });

        const isPublished = isPublishedResultStatus(
          approval?.resultStatus,
          approval?.schoolAdminApproved,
        );

        if (restrictedViewer && !isPublished) {
          return null;
        }

        const termGrades = grades.filter(
          (grade) => grade.academicTerm.id === term.id,
        );

        const visibleGrades = restrictedViewer
          ? termGrades.filter((grade) => grade.status === 'submitted')
          : termGrades;

        const termRemark = await this.remarkRepository.findOne({
          where: {
            student: { id: studentId },
            academicTerm: { id: term.id },
          },
          relations: ['teacher'],
        });

        return {
          termName: term.termName,
          termId: term.id,
          resultStatus: approval?.resultStatus ?? 'draft',
          isPublished,
          subjects: visibleGrades.map((grade) =>
            this.mapGradeToSubjectResult(grade),
          ),
          teacherRemarks: termRemark?.remarks || '',
          remarksBy: termRemark
            ? `${termRemark.teacher.firstName} ${termRemark.teacher.lastName}`
            : '',
        };
      }),
    );

    const visibleTerms = termResults.filter(Boolean);

    return {
      studentInfo: {
        academicYear: calendar.name,
        class: studentGradesForClassLevel.classLevel.name,
      },
      terms: authorizedToView
        ? termResults.filter(Boolean)
        : visibleTerms.filter(Boolean),
      gradingLegend: resolvedScheme.bands.map((band) => ({
        code: band.code,
        label: band.label,
        description: band.description,
        minScore: band.minScore,
        maxScore: band.maxScore,
      })),
      passMark: resolvedScheme.passMark,
    };
  }

  async getStudentResultsByTerm(
    studentId: string,
    academicCalendarId: string,
    academicTermId: string,
    user: SchoolAdmin | Teacher | Student | Parent,
  ) {
    const [calendar, academicTerm, student] = await Promise.all([
      this.academicCalendarRepository.findOne({
        where: { id: academicCalendarId },
        relations: ['school'],
      }),
      this.academicTermRepository.findOne({ where: { id: academicTermId } }),
      this.studentRepository.findOne({
        where: { id: studentId },
        relations: ['classLevels', 'school'],
      }),
    ]);

    if (!calendar) throw new NotFoundException('Academic calendar not found');
    if (!academicTerm) throw new NotFoundException('Academic term not found');
    if (!student) throw new NotFoundException('Student not found');

    const studentGradesForClassLevel =
      await this.studentGradeRepository.findOne({
        where: {
          student: { id: studentId },
          academicTerm: { id: academicTermId },
        },
        relations: ['classLevel'],
      });

    if (!studentGradesForClassLevel?.classLevel) {
      return {
        studentInfo: {
          academicYear: calendar.name,
          term: academicTerm.termName,
          class: null,
          isApproved: false,
          approvedAt: undefined,
          schoolAdminApproved: false,
          schoolAdminApprovedAt: undefined,
        },
        subjects: [],
        teacherRemarks: '',
        remarksBy: '',
      };
    }

    const studentClassLevelId = studentGradesForClassLevel.classLevel.id;
    const studentClassName = studentGradesForClassLevel.classLevel.name;

    const authorizedToView = await isSchoolAdminOrClassTeacher(
      user,
      studentClassLevelId,
      this.classLevelRepository,
    );

    const approval = await this.classLevelResultApprovalRepository.findOne({
      where: {
        classLevel: { id: studentClassLevelId },
        academicTerm: { id: academicTermId },
      },
    });

    if (!approval?.schoolAdminApproved && !authorizedToView) {
      const isPublished = isPublishedResultStatus(
        approval?.resultStatus,
        approval?.schoolAdminApproved,
      );
      if (
        isStudentParentRestrictedRole(user.role?.label) &&
        !isPublished
      ) {
        return {
          studentInfo: {
            academicYear: calendar.name,
            term: academicTerm.termName,
            class: studentClassName,
            isApproved: false,
            approvedAt: undefined,
            schoolAdminApproved: false,
            schoolAdminApprovedAt: undefined,
            resultStatus: approval?.resultStatus ?? 'draft',
          },
          subjects: [],
          teacherRemarks: '',
          remarksBy: '',
          gradingLegend: [],
        };
      }
    }

    const restrictedViewer = isStudentParentRestrictedRole(user.role?.label);
    const isPublished = isPublishedResultStatus(
      approval?.resultStatus,
      approval?.schoolAdminApproved,
    );
    if (restrictedViewer && !isPublished) {
      return {
        studentInfo: {
          academicYear: calendar.name,
          term: academicTerm.termName,
          class: studentClassName,
          isApproved: approval?.approved || false,
          approvedAt: approval?.approvedAt,
          schoolAdminApproved: false,
          schoolAdminApprovedAt: undefined,
          resultStatus: approval?.resultStatus ?? 'draft',
        },
        subjects: [],
        teacherRemarks: '',
        remarksBy: '',
        gradingLegend: [],
      };
    }

    const studentGrades = await this.studentGradeRepository.find({
      where: {
        student: { id: studentId },
        academicCalendar: { id: academicCalendarId },
        academicTerm: { id: academicTermId },
      },
      relations: ['subject', 'subject.subjectCatalog', 'classLevel'],
    });

    if (!studentGrades.length) {
      throw new NotFoundException('No results found for student in this term');
    }

    // Get the class level from the first grade (assuming all grades are for the same class level)
    const classLevelId = studentGrades[0]?.classLevel?.id;

    // Fetch approval status for this class level and term
    let isApproved = false;
    let approvedAt: Date | undefined = undefined;
    let schoolAdminApproved = false;
    let schoolAdminApprovedAt: Date | undefined = undefined;
    if (classLevelId) {
      const approval = await this.classLevelResultApprovalRepository.findOne({
        where: {
          classLevel: { id: classLevelId },
          academicTerm: { id: academicTermId },
        },
      });
      isApproved = approval?.approved || false;
      approvedAt = approval?.approvedAt;
      schoolAdminApproved = approval?.schoolAdminApproved || false;
      schoolAdminApprovedAt = approval?.schoolAdminApprovedAt;
    }

    const subjectIds = studentGrades.map((g) => g.subject.id);
    const allGradesInTerm = await this.studentGradeRepository.find({
      where: {
        academicCalendar: { id: academicCalendarId },
        academicTerm: { id: academicTermId },
        subject: { id: In(subjectIds) },
      },
      relations: ['subject', 'student'],
    });

    const toOrdinal = (n: number): string => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const visibleGrades = restrictedViewer
      ? studentGrades.filter((grade) => grade.status === 'submitted')
      : studentGrades;

    const resolvedScheme = await this.resolveGradingScheme(
      calendar.school?.id ?? student.school.id,
      classLevelId,
      academicTermId,
    );

    const resultWithPercentile = visibleGrades.map((grade) => {
      const subjectGrades = allGradesInTerm.filter(
        (g) => g.subject.id === grade.subject.id,
      );

      subjectGrades.sort((a, b) => b.totalScore - a.totalScore);

      const rank =
        subjectGrades.findIndex((g) => g.student.id === studentId) + 1;
      const totalStudents = subjectGrades.length;

      const percentile =
        totalStudents > 1
          ? Math.round(((totalStudents - rank) / (totalStudents - 1)) * 100)
          : 100;

      return {
        ...this.mapGradeToSubjectResult(grade),
        percentile: `${percentile}th`,
        rank: toOrdinal(rank),
      };
    });

    const termRemark = await this.remarkRepository.findOne({
      where: {
        student: { id: studentId },
        academicTerm: { id: academicTermId },
      },
      relations: ['teacher'],
    });

    return {
      studentInfo: {
        academicYear: calendar.name,
        term: academicTerm.termName,
        class: studentGrades[0]?.classLevel.name,
        isApproved,
        approvedAt,
        schoolAdminApproved,
        schoolAdminApprovedAt,
        resultStatus: approval?.resultStatus ?? 'draft',
        returnNote: approval?.returnNote ?? null,
        publishedAt: approval?.publishedAt ?? null,
      },
      subjects: resultWithPercentile,
      teacherRemarks: termRemark?.remarks || '',
      remarksBy: termRemark
        ? `${termRemark.teacher.firstName} ${termRemark.teacher.lastName}`
        : '',
      gradingLegend: resolvedScheme.bands.map((band) => ({
        code: band.code,
        label: band.label,
        description: band.description,
        minScore: band.minScore,
        maxScore: band.maxScore,
      })),
      passMark: resolvedScheme.passMark,
    };
  }

  async adminCheckResults(
    classLevelId: string,
    academicTermId: string,
    schoolAdmin: SchoolAdmin,
  ) {
    const { classLevel, term, approval } = await this.getApprovalContext(
      classLevelId,
      academicTermId,
      schoolAdmin.school.id,
    );

    if (!approval?.approved && approval?.resultStatus !== 'submitted') {
      throw new BadRequestException(
        'Class results must be submitted by the class teacher before checking',
      );
    }

    if (!approval) {
      throw new BadRequestException('No submitted results found for this class');
    }

    approval.resultStatus = 'approved';
    approval.adminApprovedAt = new Date();
    approval.adminApprovedById = schoolAdmin.id;
    approval.adminApprovedByName = `${schoolAdmin.firstName} ${schoolAdmin.lastName}`;
    await this.classLevelResultApprovalRepository.save(approval);

    await this.recordGradeSubmissionHistory({
      classLevel,
      academicTerm: term,
      action: 'approved',
      performedById: schoolAdmin.id,
      performedByName: `${schoolAdmin.firstName} ${schoolAdmin.lastName}`,
      performedByRole: 'School Admin',
    });

    return {
      message: 'Results checked and approved',
      resultStatus: approval.resultStatus,
    };
  }

  async adminReturnResults(
    classLevelId: string,
    academicTermId: string,
    returnNote: string,
    schoolAdmin: SchoolAdmin,
  ) {
    const { classLevel, term, approval } = await this.getApprovalContext(
      classLevelId,
      academicTermId,
      schoolAdmin.school.id,
    );

    if (!approval) {
      throw new BadRequestException('No submitted results found for this class');
    }

    approval.resultStatus = 'returned';
    approval.returnNote = returnNote.trim();
    approval.returnedAt = new Date();
    approval.returnedById = schoolAdmin.id;
    approval.returnedByName = `${schoolAdmin.firstName} ${schoolAdmin.lastName}`;
    approval.schoolAdminApproved = false;
    approval.schoolAdminApprovedAt = undefined;
    approval.approvedBySchoolAdmin = undefined;
    approval.publishedAt = null;
    approval.publishedById = null;
    approval.publishedByName = null;
    approval.adminApprovedAt = null;
    approval.adminApprovedById = null;
    approval.adminApprovedByName = null;
    await this.classLevelResultApprovalRepository.save(approval);

    await this.recordGradeSubmissionHistory({
      classLevel,
      academicTerm: term,
      action: 'returned',
      note: returnNote.trim(),
      performedById: schoolAdmin.id,
      performedByName: `${schoolAdmin.firstName} ${schoolAdmin.lastName}`,
      performedByRole: 'School Admin',
    });

    const subjects = await this.subjectRepository.find({
      where: {
        classLevels: { id: classLevelId },
        school: { id: schoolAdmin.school.id },
      },
      relations: ['teacher'],
    });
    const teacherRecipients = [
      ...(classLevel.classTeacher?.id
        ? [{ id: classLevel.classTeacher.id, role: NotificationRecipientRole.Teacher }]
        : []),
      ...subjects
        .filter((s) => !!s.teacher?.id)
        .map((s) => ({ id: s.teacher.id, role: NotificationRecipientRole.Teacher })),
    ];
    await this.notificationService.createForRecipients({
      schoolId: schoolAdmin.school.id,
      type: NotificationType.ResultsUnlocked,
      title: 'Results returned for correction',
      message: `${classLevel.name} results returned: ${returnNote.trim()}`,
      recipients: teacherRecipients,
    });

    return {
      message: 'Results returned to teacher for correction',
      resultStatus: approval.resultStatus,
      returnNote: approval.returnNote,
    };
  }

  async adminPublishResults(
    classLevelId: string,
    academicTermId: string,
    schoolAdmin: SchoolAdmin,
  ) {
    const { classLevel, term, approval } = await this.getApprovalContext(
      classLevelId,
      academicTermId,
      schoolAdmin.school.id,
    );

    if (
      approval?.resultStatus !== 'approved' &&
      approval?.resultStatus !== 'submitted'
    ) {
      throw new BadRequestException(
        'Results must be checked and approved before publishing',
      );
    }

    approval.resultStatus = 'published';
    approval.schoolAdminApproved = true;
    approval.schoolAdminApprovedAt = new Date();
    approval.approvedBySchoolAdmin = schoolAdmin;
    approval.publishedAt = new Date();
    approval.publishedById = schoolAdmin.id;
    approval.publishedByName = `${schoolAdmin.firstName} ${schoolAdmin.lastName}`;
    await this.classLevelResultApprovalRepository.save(approval);

    await this.recordGradeSubmissionHistory({
      classLevel,
      academicTerm: term,
      action: 'published',
      performedById: schoolAdmin.id,
      performedByName: `${schoolAdmin.firstName} ${schoolAdmin.lastName}`,
      performedByRole: 'School Admin',
    });

    const subjects = await this.subjectRepository.find({
      where: {
        classLevels: { id: classLevelId },
        school: { id: schoolAdmin.school.id },
      },
      relations: ['teacher'],
    });
    const teacherRecipients = [
      ...(classLevel.classTeacher?.id
        ? [{ id: classLevel.classTeacher.id, role: NotificationRecipientRole.Teacher }]
        : []),
      ...subjects
        .filter((s) => !!s.teacher?.id)
        .map((s) => ({ id: s.teacher.id, role: NotificationRecipientRole.Teacher })),
    ];
    await this.notificationService.createForRecipients({
      schoolId: schoolAdmin.school.id,
      type: NotificationType.ResultsReleased,
      title: 'Results published',
      message: `${classLevel.name} results published for ${term.termName}`,
      recipients: teacherRecipients,
    });

    const studentRecipients = (classLevel.students ?? [])
      .filter((s) => !s.isArchived)
      .map((s) => ({ id: s.id, role: NotificationRecipientRole.Student }));

    await this.notificationService.createForRecipients({
      schoolId: schoolAdmin.school.id,
      type: NotificationType.ResultsReleased,
      title: 'Results available',
      message: `${term.termName} results are now available`,
      recipients: studentRecipients,
    });

    return {
      message: 'Results published successfully',
      resultStatus: approval.resultStatus,
      publishedAt: approval.publishedAt,
    };
  }

  async getAdminResultsReview(
    schoolAdmin: SchoolAdmin,
    filters: {
      classLevelId?: string;
      subjectId?: string;
      teacherId?: string;
      academicTermId?: string;
    },
  ) {
    const schoolId = schoolAdmin.school.id;
    let term: AcademicTerm | null = null;
    if (filters.academicTermId) {
      term = await this.academicTermRepository.findOne({
        where: {
          id: filters.academicTermId,
          academicCalendar: { school: { id: schoolId } },
        },
      });
    } else {
      term = await this.academicTermRepository.findOne({
        where: { academicCalendar: { school: { id: schoolId } } },
        order: { startDate: 'DESC' },
      });
    }
    if (!term) throw new NotFoundException('Academic term not found');

    const gradeWhere: Record<string, unknown> = {
      academicTerm: { id: term.id },
      classLevel: { school: { id: schoolId } },
    };
    if (filters.classLevelId) {
      gradeWhere.classLevel = { id: filters.classLevelId, school: { id: schoolId } };
    }
    if (filters.subjectId) {
      gradeWhere.subject = { id: filters.subjectId };
    }

    const grades = await this.studentGradeRepository.find({
      where: gradeWhere,
      relations: [
        'student',
        'subject',
        'subject.subjectCatalog',
        'subject.teacher',
        'classLevel',
      ],
    });

    const filtered = grades.filter((grade) => {
      if (filters.teacherId && grade.subject.teacher?.id !== filters.teacherId) {
        return false;
      }
      return true;
    });

    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    const classScoreMax = school?.classScorePercentage ?? 30;
    const examScoreMax = school?.examScorePercentage ?? 70;

    return {
      term: { id: term.id, name: term.termName },
      rows: filtered.map((grade) => {
        const validation = this.validateGradeEntries(
          [
            {
              studentId: grade.student.id,
              classScore: grade.classScore,
              examScore: grade.examScore,
            },
          ],
          classScoreMax,
          examScoreMax,
        );
        return {
          studentId: grade.student.id,
          studentName: `${grade.student.firstName} ${grade.student.lastName}`,
          classLevelId: grade.classLevel.id,
          className: grade.classLevel.name,
          subjectId: grade.subject.id,
          subjectName: grade.subject.subjectCatalog.name,
          teacherName: grade.subject.teacher
            ? `${grade.subject.teacher.firstName} ${grade.subject.teacher.lastName}`
            : '',
          ...this.mapGradeToSubjectResult(grade),
          status: grade.status,
          isInvalid: validation.invalid.length > 0,
          isMissing: validation.missing.length > 0,
          hasOverride: Boolean(grade.overrideGrade),
          overrideReason: grade.overrideReason,
        };
      }),
    };
  }

  async getGradeSubmissionHistory(
    classLevelId: string,
    academicTermId: string,
    schoolAdmin: SchoolAdmin,
  ) {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId, school: { id: schoolAdmin.school.id } },
    });
    if (!classLevel) throw new NotFoundException('Class level not found');

    const history = await this.gradeSubmissionHistoryRepository.find({
      where: {
        classLevel: { id: classLevelId },
        academicTerm: { id: academicTermId },
      },
      order: { createdAt: 'DESC' },
    });

    return history.map((entry) => ({
      id: entry.id,
      action: entry.action,
      note: entry.note,
      performedByName: entry.performedByName,
      performedByRole: entry.performedByRole,
      createdAt: entry.createdAt,
    }));
  }

  async getActiveGradingLegend(
    schoolId: string,
    classLevelId?: string,
    academicTermId?: string,
  ) {
    const resolved = await this.resolveGradingScheme(
      schoolId,
      classLevelId,
      academicTermId,
    );
    return {
      passMark: resolved.passMark,
      scoreScaleMin: resolved.scoreScaleMin,
      scoreScaleMax: resolved.scoreScaleMax,
      schemeId: resolved.schemeId,
      schemeVersion: resolved.schemeVersion,
      bands: resolved.bands.map((band) => ({
        code: band.code,
        label: band.label,
        description: band.description,
        minScore: band.minScore,
        maxScore: band.maxScore,
      })),
    };
  }

  async submitGrades(dto: SubmitGradesDto & { teacherId: string }) {
    const {
      classLevelId,
      subjectId,
      academicTermId,
      teacherId,
      grades,
      saveMode,
      forceSubmit,
    } = dto;

    const [classLevel, subject, academicTerm, teacher] = await Promise.all([
      this.classLevelRepository.findOne({
        where: { id: classLevelId },
        relations: ['classTeacher'],
      }),
      this.subjectRepository.findOne({
        where: { id: subjectId },
        relations: ['school'],
      }),
      this.academicTermRepository.findOne({
        where: { id: academicTermId },
        relations: ['academicCalendar'],
      }),
      this.teacherRepository.findOne({
        where: { id: teacherId },
      }),
    ]);

    if (!classLevel) throw new NotFoundException('Class level not found');
    if (!subject) throw new NotFoundException('Subject not found');
    if (!academicTerm) throw new NotFoundException('Academic term not found');
    if (!teacher) throw new NotFoundException('Teacher not found');

    const school = await this.schoolRepository.findOne({
      where: { id: subject.school.id },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const classScoreMax = school.classScorePercentage || 30;
    const examScoreMax = school.examScorePercentage || 70;
    const resolvedScheme = await this.resolveGradingScheme(
      school.id,
      classLevelId,
      academicTermId,
    );
    const gradingBands = resolvedScheme.bands;

    if (resolvedScheme.allowManualOverride) {
      for (const entry of grades) {
        if (entry.overrideGrade && !entry.overrideReason?.trim()) {
          throw new BadRequestException(
            'Override reason is required when manual grade override is used',
          );
        }
      }
    } else {
      for (const entry of grades) {
        if (entry.overrideGrade) {
          throw new BadRequestException(
            'Manual grade override is not enabled for this school',
          );
        }
      }
    }

    const validation = this.validateGradeEntries(
      grades,
      classScoreMax,
      examScoreMax,
    );
    if (validation.invalid.length) {
      throw new BadRequestException(
        validation.invalid.map((v) => v.message).join('; '),
      );
    }
    if (saveMode === 'submit' && validation.missing.length && !forceSubmit) {
      throw new BadRequestException({
        message: 'Some students have missing scores',
        missing: validation.missing,
      });
    }

    const status: 'draft' | 'submitted' =
      saveMode === 'draft' ? 'draft' : 'submitted';

    const results = await Promise.all(
      grades.map(async (entry) => {
        const student = await this.studentRepository.findOne({
          where: { id: entry.studentId },
        });
        if (!student) {
          throw new NotFoundException(`Student ${entry.studentId} not found`);
        }

        const classScore =
          entry.classScore === null || entry.classScore === undefined
            ? null
            : Number(entry.classScore);
        const examScore =
          entry.examScore === null || entry.examScore === undefined
            ? null
            : Number(entry.examScore);

        if (classScore === null && examScore === null && !entry.feedback?.trim()) {
          return null;
        }

        const studentGrade =
          (await this.studentGradeRepository.findOne({
            where: {
              student: { id: student.id },
              subject: { id: subject.id },
              classLevel: { id: classLevel.id },
              academicTerm: { id: academicTerm.id },
            },
          })) ||
          this.studentGradeRepository.create({
            student,
            subject,
            classLevel,
            academicTerm,
            academicCalendar: academicTerm.academicCalendar,
            teacher,
          });

        if (
          studentGrade.id &&
          studentGrade.status === 'submitted' &&
          saveMode !== 'draft'
        ) {
          const approval = await this.classLevelResultApprovalRepository.findOne({
            where: {
              classLevel: { id: classLevelId },
              academicTerm: { id: academicTermId },
            },
          });
          if (approval?.resultStatus !== 'returned' && approval?.resultStatus !== 'draft') {
            throw new ForbiddenException(
              `Submitted grades for student ${student.firstName} ${student.lastName} cannot be edited until returned by admin`,
            );
          }
        }

        const resolvedClass = classScore ?? 0;
        const resolvedExam = examScore ?? 0;
        const rawTotal = resolvedClass + resolvedExam;
        const totalScore = applyScoreRounding(
          rawTotal,
          resolvedScheme.rounding,
        );

        let grade: string;
        let gradeLabel: string;
        let bandDescription: string | null;

        if (entry.overrideGrade?.trim() && resolvedScheme.allowManualOverride) {
          grade = entry.overrideGrade.trim();
          gradeLabel = entry.overrideGrade.trim();
          bandDescription = entry.overrideReason?.trim() ?? null;
          studentGrade.overrideGrade = grade;
          studentGrade.overrideReason = entry.overrideReason?.trim() ?? null;
          studentGrade.overriddenById = teacher.id;
          studentGrade.overriddenByName = `${teacher.firstName} ${teacher.lastName}`;
        } else {
          const resolved = resolveGradeFromBands(
            totalScore,
            gradingBands,
            resolvedScheme.passMark,
          );
          grade = resolved.grade;
          gradeLabel = resolved.gradeLabel;
          bandDescription = resolved.bandDescription;
          studentGrade.overrideGrade = null;
          studentGrade.overrideReason = null;
          studentGrade.overriddenById = null;
          studentGrade.overriddenByName = null;
        }

        studentGrade.classScore = resolvedClass;
        studentGrade.examScore = resolvedExam;
        studentGrade.totalScore = totalScore;
        studentGrade.grade = grade;
        studentGrade.gradeLabel = gradeLabel;
        studentGrade.bandDescription = bandDescription;
        studentGrade.gradingSchemeId = resolvedScheme.schemeId;
        studentGrade.gradingSchemeVersion = resolvedScheme.schemeVersion;
        studentGrade.feedback =
          entry.feedback !== undefined
            ? entry.feedback?.trim() || null
            : studentGrade.feedback ?? null;
        studentGrade.status = status;
        studentGrade.teacher = teacher;

        return this.studentGradeRepository.save(studentGrade);
      }),
    );

    const saved = results.filter(Boolean);

    if (
      saveMode === 'submit' &&
      classLevel.classTeacher?.id &&
      classLevel.classTeacher.id !== teacherId
    ) {
      await this.notificationService.createForRecipients({
        schoolId: subject.school.id,
        type: NotificationType.GradesSubmitted,
        title: 'Grades submitted',
        message: `${subject.subjectCatalog?.name ?? 'Subject'} grades submitted for ${classLevel.name}`,
        recipients: [
          {
            id: classLevel.classTeacher.id,
            role: NotificationRecipientRole.Teacher,
          },
        ],
      });
    }

    if (saveMode === 'submit') {
      try {
        await this.notificationService.create({
          title: 'Subject grades submitted',
          message: `${teacher.firstName} ${teacher.lastName} submitted ${subject.subjectCatalog?.name ?? 'subject'} grades for ${classLevel.name}.`,
          schoolId: subject.school.id,
          type: NotificationType.GradesSubmitted,
        });
      } catch {
        // Non-blocking admin notification.
      }
    }

    return {
      message:
        saveMode === 'draft'
          ? 'Grades saved as draft'
          : 'Grades submitted successfully',
      saveMode,
      validation,
      data: saved.map((grade) => ({
        studentId: grade!.student.id,
        classScore: grade!.classScore,
        examScore: grade!.examScore,
        totalScore: grade!.totalScore,
        grade: grade!.grade,
        gradeLabel: grade!.gradeLabel,
        feedback: grade!.feedback,
        status: grade!.status,
      })),
    };
  }

  private async getApprovalContext(
    classLevelId: string,
    academicTermId: string,
    schoolId: string,
  ) {
    const [classLevel, term] = await Promise.all([
      this.classLevelRepository.findOne({
        where: { id: classLevelId, school: { id: schoolId } },
        relations: ['students', 'classTeacher'],
      }),
      this.academicTermRepository.findOne({
        where: {
          id: academicTermId,
          academicCalendar: { school: { id: schoolId } },
        },
      }),
    ]);
    if (!classLevel) throw new NotFoundException('Class level not found');
    if (!term) throw new NotFoundException('Academic term not found');

    let approval = await this.classLevelResultApprovalRepository.findOne({
      where: {
        classLevel: { id: classLevelId },
        academicTerm: { id: academicTermId },
      },
    });
    if (!approval) {
      approval = this.classLevelResultApprovalRepository.create({
        classLevel,
        academicTerm: term,
        approved: false,
        resultStatus: 'draft',
      });
      approval = await this.classLevelResultApprovalRepository.save(approval);
    }
    return { classLevel, term, approval };
  }

  private async reopenStudentGradesForClassTerm(
    classLevelId: string,
    academicTermId: string,
  ): Promise<void> {
    await this.studentGradeRepository.update(
      {
        classLevel: { id: classLevelId },
        academicTerm: { id: academicTermId },
      },
      { status: 'draft' },
    );
  }

  private async recordGradeSubmissionHistory(input: {
    classLevel: ClassLevel;
    academicTerm: AcademicTerm;
    action: GradeSubmissionHistory['action'];
    note?: string | null;
    performedById?: string | null;
    performedByName?: string | null;
    performedByRole?: string | null;
  }) {
    const entry = this.gradeSubmissionHistoryRepository.create({
      classLevel: input.classLevel,
      academicTerm: input.academicTerm,
      action: input.action,
      note: input.note ?? null,
      performedById: input.performedById ?? null,
      performedByName: input.performedByName ?? null,
      performedByRole: input.performedByRole ?? null,
    });
    await this.gradeSubmissionHistoryRepository.save(entry);
  }

  private mapGradeToSubjectResult(grade: StudentGrade) {
    return {
      subject: grade.subject.subjectCatalog.name,
      classScore: grade.classScore,
      examScore: grade.examScore,
      totalScore: grade.totalScore,
      grade: grade.grade,
      gradeLabel: grade.gradeLabel,
      bandDescription: grade.bandDescription,
      feedback: grade.feedback,
      percentage: `${Math.round(grade.totalScore)}%`,
      hasOverride: Boolean(grade.overrideGrade),
      overrideReason: grade.overrideReason,
      gradingSchemeId: grade.gradingSchemeId,
      gradingSchemeVersion: grade.gradingSchemeVersion,
    };
  }

  private async resolveGradingBandsForContext(
    schoolId: string,
    classLevelId?: string,
    academicTermId?: string,
  ) {
    const resolved = await this.resolveGradingScheme(
      schoolId,
      classLevelId,
      academicTermId,
    );
    return resolved.bands.map((band) => ({
      code: band.code,
      label: band.label,
      minScore: band.minScore,
      maxScore: band.maxScore,
    }));
  }

  private async resolveGradingScheme(
    schoolId: string,
    classLevelId?: string,
    academicTermId?: string,
  ): Promise<ResolvedGradingScheme> {
    const activeSchemes = await this.gradingSchemeRepository.find({
      where: { school: { id: schoolId }, status: 'active' },
      relations: ['bands', 'classLevels'],
    });

    let academicTerm: AcademicTerm | null = null;
    if (academicTermId) {
      academicTerm = await this.academicTermRepository.findOne({
        where: { id: academicTermId },
        relations: ['academicCalendar'],
      });
    }

    const applicable = activeSchemes.filter((scheme) => {
      if (!scheme.effectiveFrom) return true;
      if (!academicTerm) return true;
      return (
        scheme.effectiveFrom === academicTerm.id ||
        scheme.effectiveFrom === academicTerm.termName ||
        scheme.effectiveFrom === academicTerm.academicCalendar?.id
      );
    });

    const classLevelScheme = classLevelId
      ? applicable.find(
          (scheme) =>
            scheme.scopeType === 'classLevels' &&
            scheme.classLevels?.some((level) => level.id === classLevelId),
        )
      : null;
    const schoolScheme = applicable.find(
      (scheme) => scheme.scopeType === 'school',
    );
    const chosen = classLevelScheme ?? schoolScheme ?? applicable[0] ?? null;

    if (chosen?.bands?.length) {
      const bands = [...chosen.bands]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((band) => ({
          code: band.code,
          label: band.label,
          description: band.description,
          minScore: band.minScore,
          maxScore: band.maxScore,
        }));
      return {
        schemeId: chosen.id,
        schemeVersion: chosen.version,
        passMark: chosen.passMark,
        rounding: chosen.rounding,
        allowManualOverride: chosen.allowManualOverride,
        scoreScaleMin: chosen.scoreScaleMin,
        scoreScaleMax: chosen.scoreScaleMax,
        bands,
      };
    }

    const legacy = await this.gradingSystemRepository.find({
      where: { school: { id: schoolId } },
      order: { minRange: 'DESC' },
    });
    return {
      schemeId: null,
      schemeVersion: null,
      passMark: 50,
      rounding: 'nearest',
      allowManualOverride: false,
      scoreScaleMin: 0,
      scoreScaleMax: 100,
      bands: legacy.map((row) => ({
        code: row.grade,
        label: row.grade,
        description: null,
        minScore: row.minRange,
        maxScore: row.maxRange,
      })),
    };
  }

  private resolveGradeFromTotal(
    totalScore: number,
    gradingBands: ResolvedGradingScheme['bands'],
  ) {
    const resolved = resolveGradeFromBands(totalScore, gradingBands);
    return {
      grade: resolved.grade,
      gradeLabel: resolved.gradeLabel,
    };
  }

  private validateGradeEntries(
    grades: SubmitGradesDto['grades'],
    classScoreMax: number,
    examScoreMax: number,
  ) {
    const invalid: Array<{ studentId: string; message: string }> = [];
    const missing: Array<{ studentId: string; message: string }> = [];

    for (const entry of grades) {
      const classProvided =
        entry.classScore !== null && entry.classScore !== undefined;
      const examProvided =
        entry.examScore !== null && entry.examScore !== undefined;

      if (!classProvided || !examProvided) {
        missing.push({
          studentId: entry.studentId,
          message:
            !classProvided && !examProvided
              ? 'Class and exam scores missing'
              : !classProvided
                ? 'Class score missing'
                : 'Exam score missing',
        });
      }

      if (classProvided) {
        const classScore = Number(entry.classScore);
        if (
          Number.isNaN(classScore) ||
          classScore < 0 ||
          classScore > classScoreMax
        ) {
          invalid.push({
            studentId: entry.studentId,
            message: `Class score must be between 0 and ${classScoreMax}`,
          });
        }
      }
      if (examProvided) {
        const examScore = Number(entry.examScore);
        if (
          Number.isNaN(examScore) ||
          examScore < 0 ||
          examScore > examScoreMax
        ) {
          invalid.push({
            studentId: entry.studentId,
            message: `Exam score must be between 0 and ${examScoreMax}`,
          });
        }
      }
    }

    return { invalid, missing };
  }
}
