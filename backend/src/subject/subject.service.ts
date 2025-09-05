import {
  BadRequestException,
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
import { GradingSystem } from '../grading-system/grading-system.entity';
import { StudentTermRemark } from './student-term-remark.entity';
import { QueryString } from 'src/common/api-features/api-features';
import { ClassLevelResultApproval } from 'src/class-level/class-level-result-approval.entity';

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
    @InjectRepository(StudentTermRemark)
    private remarkRepository: Repository<StudentTermRemark>,
    @InjectRepository(ClassLevelResultApproval)
    private classLevelResultApprovalRepository: Repository<ClassLevelResultApproval>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto, admin: SchoolAdmin) {
    const { subjectCatalogId, classLevelIds, teacherId } = createSubjectDto;

    // Validate subject catalog
    const subjectCatalog = await this.subjectCatalogRepository.findOne({
      where: { id: subjectCatalogId },
    });
    if (!subjectCatalog) {
      throw new NotFoundException('Subject catalog entry not found');
    }

    // Validate teacher
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Validate admin and school
    if (!admin.school) {
      throw new NotFoundException('Admin is not associated with a school');
    }

    const school = await this.schoolRepository.findOne({
      where: { id: admin.school.id },
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
          where: { id },
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
    admin: SchoolAdmin,
  ) {
    const subject = await this.subjectRepository.findOne({
      where: { id, school: { id: admin.school.id } },
      relations: ['classLevels', 'subjectCatalog', 'teacher'],
    });

    if (!subject) throw new NotFoundException('Subject not found');

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
        where: { id: updateSubjectDto.teacherId },
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
          where: { id: classLevelId },
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

  async remove(id: string, admin: SchoolAdmin): Promise<void> {
    const subject = await this.subjectRepository.findOne({
      where: { id, school: { id: admin.school.id } },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    await this.subjectRepository.delete(subject.id);
  }

  async toggleClassResultsApproval(
    classLevelId: string,
    teacher: Teacher,
    action: 'approve' | 'unapprove' = 'approve',
    forceApprove = false,
  ) {
    const latestTerm = await this.academicTermRepository.findOne({
      where: { academicCalendar: { school: { id: teacher.school.id } } },
      order: { startDate: 'DESC' },
      relations: ['academicCalendar'],
    });
    if (!latestTerm)
      throw new NotFoundException('No academic term found for this school');

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
        academicTerm: { id: latestTerm.id },
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
        academicTerm: { id: latestTerm.id },
      },
    });

    if (approval?.schoolAdminApproved) {
      return {
        message:
          'Results have been approved by school admin. Only school admin can modify the approval status.',
        approved: approval.approved,
        schoolAdminApproved: approval.schoolAdminApproved,
        schoolAdminApprovedAt: approval.schoolAdminApprovedAt,
        term: latestTerm.termName,
        missingGrades: [],
      };
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
        academicTerm: latestTerm,
        approved: action === 'approve',
        approvedAt: action === 'approve' ? new Date() : undefined,
        schoolAdminApproved: false,
        schoolAdminApprovedAt: undefined,
        approvedBySchoolAdmin: undefined,
      });
    } else {
      approval.approved = action === 'approve';
      approval.approvedAt = action === 'approve' ? new Date() : undefined;
    }
    await this.classLevelResultApprovalRepository.save(approval);

    return {
      message:
        action === 'approve'
          ? 'Class level results approved for this term.'
          : 'Class level results unapproved for this term.',
      approved: approval.approved,
      approvedAt: approval.approvedAt,
      schoolAdminApproved: approval.schoolAdminApproved,
      schoolAdminApprovedAt: approval.schoolAdminApprovedAt,
      term: latestTerm.termName,
      missingGrades: action === 'approve' ? missingGrades : [],
    };
  }

  async getClassResultsApprovalStatus(
    classLevelId: string,
    user: Teacher | SchoolAdmin,
  ) {
    const latestTerm = await this.academicTermRepository.findOne({
      where: { academicCalendar: { school: { id: user.school.id } } },
      order: { startDate: 'DESC' },
      relations: ['academicCalendar'],
    });
    if (!latestTerm)
      throw new NotFoundException('No academic term found for this school');

    const approval = await this.classLevelResultApprovalRepository.findOne({
      where: {
        classLevel: { id: classLevelId },
        academicTerm: { id: latestTerm.id },
      },
    });

    return {
      isApproved: approval?.approved || false,
      approvedAt: approval?.approvedAt,
      schoolAdminApproved: approval?.schoolAdminApproved || false,
      schoolAdminApprovedAt: approval?.schoolAdminApprovedAt,
      approvedBySchoolAdmin: approval?.approvedBySchoolAdmin,
      term: latestTerm.termName,
      termId: latestTerm.id,
    };
  }

  async toggleSchoolAdminApproval(
    classLevelId: string,
    schoolAdmin: SchoolAdmin,
    action: 'approve' | 'unapprove' = 'approve',
  ) {
    const latestTerm = await this.academicTermRepository.findOne({
      where: { academicCalendar: { school: { id: schoolAdmin.school.id } } },
      order: { startDate: 'DESC' },
      relations: ['academicCalendar'],
    });
    if (!latestTerm)
      throw new NotFoundException('No academic term found for this school');

    const classLevel = await this.classLevelRepository.findOne({
      where: { id: classLevelId },
    });
    if (!classLevel) throw new NotFoundException('Class level not found');

    let approval = await this.classLevelResultApprovalRepository.findOne({
      where: {
        classLevel: { id: classLevelId },
        academicTerm: { id: latestTerm.id },
      },
    });

    if (!approval) {
      // Create new approval record if it doesn't exist
      approval = this.classLevelResultApprovalRepository.create({
        classLevel,
        academicTerm: latestTerm,
        approved: false,
        approvedAt: undefined,
        schoolAdminApproved: action === 'approve',
        schoolAdminApprovedAt: action === 'approve' ? new Date() : undefined,
        approvedBySchoolAdmin: action === 'approve' ? schoolAdmin : undefined,
      });
    } else {
      // Update existing approval record
      approval.schoolAdminApproved = action === 'approve';
      approval.schoolAdminApprovedAt =
        action === 'approve' ? new Date() : undefined;
      approval.approvedBySchoolAdmin =
        action === 'approve' ? schoolAdmin : undefined;
    }

    await this.classLevelResultApprovalRepository.save(approval);

    return {
      message:
        action === 'approve'
          ? 'Class level results approved by school admin.'
          : 'Class level results unapproved by school admin.',
      approved: approval.approved,
      approvedAt: approval.approvedAt,
      schoolAdminApproved: approval.schoolAdminApproved,
      schoolAdminApprovedAt: approval.schoolAdminApprovedAt,
      approvedBySchoolAdmin: approval.approvedBySchoolAdmin,
      term: latestTerm.termName,
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
      relations: ['subjectCatalog'],
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
    return {
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
      },
      students: classLevel.students.map((student) => {
        const existingGrade = gradeMap.get(student.id);
        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          studentId: student.studentId,
          scores: {
            classScore: existingGrade?.classScore || 0, // 30%
            examScore: existingGrade?.examScore || 0, // 70%
            totalScore: existingGrade?.totalScore || 0,
            grade: existingGrade?.grade || '',
          },
        };
      }),
    };
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

  async getStudentResults(studentId: string, academicCalendarId: string) {
    const calendar = await this.academicCalendarRepository.findOne({
      where: { id: academicCalendarId },
      relations: ['terms'],
    });

    if (!calendar) {
      throw new NotFoundException('Academic calendar not found');
    }

    // Sort terms by startDate
    const sortedTerms = calendar.terms.sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );

    // Get all grades for this student in this calendar
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

    // Group grades by term
    const termResults = await Promise.all(
      sortedTerms.map(async (term) => {
        const termGrades = grades.filter(
          (grade) => grade.academicTerm.id === term.id,
        );

        const termRemark = await this.remarkRepository.findOne({
          where: {
            student: { id: studentId },
            academicTerm: { id: term.id },
          },
          relations: ['teacher'],
        });

        return {
          termName: term.termName,
          subjects: termGrades.map((grade) => ({
            subject: grade.subject.subjectCatalog.name,
            classScore: grade.classScore,
            examScore: grade.examScore,
            totalScore: grade.totalScore,
            grade: grade.grade,
            percentage: ((grade.totalScore / 100) * 100).toFixed(0) + '%',
          })),
          teacherRemarks: termRemark?.remarks || '',
          remarksBy: termRemark
            ? `${termRemark.teacher.firstName} ${termRemark.teacher.lastName}`
            : '',
        };
      }),
    );

    return {
      studentInfo: {
        academicYear: calendar.name,
        class: grades[0]?.classLevel.name,
      },
      terms: termResults,
    };
  }

  async getStudentResultsByTerm(
    studentId: string,
    academicCalendarId: string,
    academicTermId: string,
  ) {
    const [calendar, academicTerm, student] = await Promise.all([
      this.academicCalendarRepository.findOne({
        where: { id: academicCalendarId },
      }),
      this.academicTermRepository.findOne({ where: { id: academicTermId } }),
      this.studentRepository.findOne({ where: { id: studentId } }),
    ]);

    if (!calendar) throw new NotFoundException('Academic calendar not found');
    if (!academicTerm) throw new NotFoundException('Academic term not found');
    if (!student) throw new NotFoundException('Student not found');

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
    if (classLevelId) {
      const approval = await this.classLevelResultApprovalRepository.findOne({
        where: {
          classLevel: { id: classLevelId },
          academicTerm: { id: academicTermId },
        },
      });
      isApproved = approval?.approved || false;
      approvedAt = approval?.approvedAt;
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

    const resultWithPercentile = studentGrades.map((grade) => {
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
        subject: grade.subject.subjectCatalog.name,
        classScore: grade.classScore,
        examScore: grade.examScore,
        totalScore: grade.totalScore,
        grade: grade.grade,
        percentage: `${Math.round((grade.totalScore / 100) * 100)}%`,
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
      },
      subjects: resultWithPercentile,
      teacherRemarks: termRemark?.remarks || '',
      remarksBy: termRemark
        ? `${termRemark.teacher.firstName} ${termRemark.teacher.lastName}`
        : '',
    };
  }

  async submitGrades({
    classLevelId,
    subjectId,
    academicTermId,
    teacherId,
    grades,
  }: {
    classLevelId: string;
    subjectId: string;
    academicTermId: string;
    teacherId: string;
    grades: Array<{ studentId: string; classScore: number; examScore: number }>;
  }) {
    // Validate all required entities
    const [classLevel, subject, academicTerm, teacher] = await Promise.all([
      this.classLevelRepository.findOne({
        where: { id: classLevelId },
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

    // Fetch grading system for the school
    const gradingSystem = await this.gradingSystemRepository.find({
      where: { school: { id: subject.school.id } },
      order: { minRange: 'DESC' }, // Order by range to find correct grade
    });

    if (!gradingSystem?.length) {
      throw new NotFoundException('Grading system not found for this school');
    }

    // Validate scores
    for (const grade of grades) {
      if (grade.classScore < 0 || grade.classScore > 30) {
        throw new BadRequestException(
          `Class score must be between 0 and 30 for student ${grade.studentId}`,
        );
      }
      if (grade.examScore < 0 || grade.examScore > 70) {
        throw new BadRequestException(
          `Exam score must be between 0 and 70 for student ${grade.studentId}`,
        );
      }
    }

    // Process grades in batch
    const results = await Promise.all(
      grades.map(async (g) => {
        const student = await this.studentRepository.findOne({
          where: { id: g.studentId },
        });

        if (!student) {
          throw new NotFoundException(`Student ${g.studentId} not found`);
        }

        const totalScore = g.classScore + g.examScore;

        // Find appropriate grade based on total score
        const gradeObj = gradingSystem.find(
          (gs) => totalScore >= gs.minRange && totalScore <= gs.maxRange,
        );

        // Upsert the grade
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

        // Update grade data
        studentGrade.classScore = g.classScore;
        studentGrade.examScore = g.examScore;
        studentGrade.totalScore = totalScore;
        studentGrade.grade = gradeObj?.grade || 'N/A';

        return this.studentGradeRepository.save(studentGrade);
      }),
    );

    return {
      message: 'Grades submitted successfully',
      data: results.map((grade) => ({
        studentId: grade.student.id,
        classScore: grade.classScore,
        examScore: grade.examScore,
        totalScore: grade.totalScore,
        grade: grade.grade,
      })),
    };
  }
}
