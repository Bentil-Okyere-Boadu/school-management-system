import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { SchoolAdmin } from './school-admin.entity';
import { Student } from 'src/student/student.entity';
import { APIFeatures, QueryString } from 'src/common/api-features/api-features';
import { School } from 'src/school/school.entity';
import { ProfileService } from 'src/profile/profile.service';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { Teacher } from 'src/teacher/teacher.entity';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { AttendanceService } from 'src/attendance/attendance.service';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { Assignment } from 'src/teacher/entities/assignment.entity';
import { AssignmentSubmission } from 'src/student/entities/assignment-submission.entity';

@Injectable()
export class SchoolAdminService {
  private readonly logger = new Logger(SchoolAdminService.name);

  constructor(
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    private readonly objectStorageService: ObjectStorageServiceService,
    private readonly profileService: ProfileService,
    private readonly attendanceService: AttendanceService,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission)
    private assignmentSubmissionRepository: Repository<AssignmentSubmission>,
  ) {}

  async findAll(): Promise<SchoolAdmin[]> {
    return this.schoolAdminRepository.find();
  }

  async findOne(id: string): Promise<SchoolAdmin> {
    const schoolAdmin = await this.schoolAdminRepository.findOne({
      where: { id },
    });

    if (!schoolAdmin) {
      throw new NotFoundException(`School admin with ID ${id} not found`);
    }

    return schoolAdmin;
  }

  async update(
    id: string,
    updateSchoolAdminDto: Partial<SchoolAdmin>,
  ): Promise<SchoolAdmin> {
    const schoolAdmin = await this.findOne(id);
    Object.assign(schoolAdmin, updateSchoolAdminDto);
    return this.schoolAdminRepository.save(schoolAdmin);
  }

  async remove(id: string): Promise<void> {
    const schoolAdmin = await this.findOne(id);
    await this.schoolAdminRepository.remove(schoolAdmin);
  }

  async findAllStudents(schoolId: string, queryString: QueryString) {
    const baseQuery = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.role', 'role')
      .leftJoinAndSelect('student.school', 'school')
      .leftJoinAndSelect('student.classLevels', 'classLevel')
      .leftJoinAndSelect('student.profile', 'profile')
      .where('student.school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived: false });

    const featuresWithoutPagination = new APIFeatures(
      baseQuery.clone(),
      queryString,
    )
      .filter()
      .sort()
      .search(['firstName', 'lastName', 'email'])
      .limitFields();

    const total = await featuresWithoutPagination.getQuery().getCount();

    const featuresWithPagination = featuresWithoutPagination.paginate();
    const students = await featuresWithPagination.getQuery().getMany();

    // Sign profile URLs
    const signedStudents = await Promise.all(
      students.map(async (student) => {
        if (student.profile?.id) {
          student.profile = await this.profileService.getProfileWithImageUrl(
            student.profile.id,
          );
        }
        return student;
      }),
    );

    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const totalPages = Math.ceil(total / limit);

    return {
      data: signedStudents,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findAllUsers(schoolId: string, queryString: QueryString) {
    const isArchived = queryString.status === 'archived' ? true : false;

    // --- Students Query ---
    const studentsQuery = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.role', 'role')
      .leftJoinAndSelect('student.school', 'school')
      .leftJoinAndSelect('student.profile', 'profile')
      .leftJoinAndSelect('student.classLevels', 'classLevel')
      .where('student.school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived });

    const studentsFeatures = new APIFeatures(studentsQuery, queryString)
      .filter()
      .sort()
      .search(['firstName', 'lastName', 'email'])
      .limitFields();

    const students = await studentsFeatures.getQuery().getMany();

    // --- Teachers Query ---
    const teachersQuery = this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.role', 'role')
      .leftJoinAndSelect('teacher.school', 'school')
      .leftJoinAndSelect('teacher.profile', 'profile')
      .where('teacher.school.id = :schoolId', { schoolId })
      .andWhere('teacher.isArchived = :isArchived', { isArchived });

    const teachersFeatures = new APIFeatures(teachersQuery, queryString)
      .filter()
      .sort()
      .search(['firstName', 'lastName', 'email'])
      .limitFields();

    const teachers = await teachersFeatures.getQuery().getMany();

    // --- Sign Profile URLs ---
    const signedStudents = await Promise.all(
      students.map(async (student) => {
        if (student.profile?.id) {
          student.profile = await this.profileService.getProfileWithImageUrl(
            student.profile.id,
          );
        }
        return {
          ...student,
          userType: 'student',
        };
      }),
    );

    const signedTeachers = await Promise.all(
      teachers.map(async (teacher) => {
        if (teacher.profile?.id) {
          teacher.profile = await this.profileService.getProfileWithImageUrl(
            teacher.profile.id,
          );
        }
        return {
          ...teacher,
          userType: 'teacher',
        };
      }),
    );

    // --- Merge, Sort, and Paginate ---
    let combined = [...signedStudents, ...signedTeachers];

    // Optional: sort combined array if needed (e.g., by createdAt desc)
    combined = combined.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });

    // Pagination
    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const total = combined.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = combined.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages,
        studentsCount: signedStudents.length,
        teachersCount: signedTeachers.length,
      },
    };
  }

  async getMySchoolWithRelations(user: SchoolAdmin) {
    if (!user.school) {
      throw new NotFoundException('School not found for this admin');
    }

    const school = await this.schoolRepository.findOne({
      where: { id: user.school.id },
      relations: [
        'admissionPolicies',
        'gradingSystems',
        'feeStructures',
        'profile',
        'academicCalendars',
        'academicCalendars.terms.holidays',
        'classLevels',
        'classLevels.teachers',
        'classLevels.students',
        'students',
        'teachers',
      ],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${user.school.id} not found`);
    }

    const signedAdmissionPolicies = await Promise.all(
      school.admissionPolicies.map(async (policy) => {
        const result = { ...policy } as typeof policy & {
          documentUrl?: string;
        };
        if (policy.documentPath) {
          try {
            result.documentUrl = await this.objectStorageService.getSignedUrl(
              policy.documentPath,
              86400, // 24 hours
            );
          } catch {
            // If there's an error getting the signed URL, we just continue without it
            this.logger.warn(
              `Failed to get signed URL for admission policy document: ${policy.id}`,
            );
          }
        }
        return result;
      }),
    );

    const signedProfile = school.profile
      ? {
          ...school.profile,
          avatarUrl: school.profile.avatarPath
            ? await this.objectStorageService.getSignedUrl(
                school.profile.avatarPath,
              )
            : undefined,
        }
      : undefined;

    return {
      ...school,
      admissionPolicies: signedAdmissionPolicies,
      profile: signedProfile,
    };
  }

  async getMySchool(user: SchoolAdmin) {
    if (!user.school) {
      throw new NotFoundException('School not found for this admin');
    }

    const school = await this.schoolRepository.findOne({
      where: { id: user.school.id },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (school.logoPath) {
      try {
        school.logoUrl = await this.objectStorageService.getSignedUrl(
          school.logoPath,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to get signed URL for school logo: ${school.id}${error}`,
        );
      }
    }

    return school;
  }
  async getUserById(userId: string, schoolId: string) {
    // Try finding a student first
    const student = await this.studentRepository.findOne({
      where: {
        id: userId,
        school: { id: schoolId },
      },
      relations: ['profile', 'classLevels'],
    });

    if (student) {
      const profileWithUrl = student.profile?.id
        ? await this.profileService.getProfileWithImageUrl(student.profile.id)
        : null;

      return {
        ...student,
        userType: 'student',
        profile: profileWithUrl,
      };
    }

    // If not a student, try finding a teacher
    const teacher = await this.teacherRepository.findOne({
      where: {
        id: userId,
        school: { id: schoolId },
      },
      relations: ['role', 'profile', 'school'],
    });

    if (teacher) {
      const profileWithUrl = teacher.profile?.id
        ? await this.profileService.getProfileWithImageUrl(teacher.profile.id)
        : null;

      return {
        ...teacher,
        userType: 'teacher',
        profile: profileWithUrl,
      };
    }

    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  async getMyProfile(user: SchoolAdmin) {
    if (!user) {
      throw new NotFoundException('no admin found');
    }

    const adminInfo = await this.schoolAdminRepository.findOne({
      where: { id: user.id },
      relations: ['role', 'profile'],
    });
    if (adminInfo?.profile?.id) {
      const profileWithUrl = await this.profileService.getProfileWithImageUrl(
        adminInfo.profile.id,
      );
      adminInfo.profile = profileWithUrl;
    }

    return adminInfo;
  }
  async updateProfile(
    adminId: string,
    updateDto: UpdateProfileDto,
  ): Promise<SchoolAdmin> {
    return this.profileService.handleUpdateProfile(
      adminId,
      updateDto,
      this.schoolAdminRepository,
      ['role', 'school', 'profile'],
    );
  }
  async findStudentById(id: string, schoolId: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: { id, school: { id: schoolId } },
    });
  }

  async archiveUser(id: string, archive: boolean) {
    const student = await this.studentRepository.findOne({ where: { id } });
    if (student) {
      student.isArchived = archive;
      student.status = archive ? 'archived' : 'active';
      return this.studentRepository.save(student);
    }

    const teacher = await this.teacherRepository.findOne({ where: { id } });
    if (teacher) {
      teacher.isArchived = archive;
      teacher.status = archive ? 'archived' : 'active';
      return this.teacherRepository.save(teacher);
    }

    throw new NotFoundException(`User with ID ${id} not found`);
  }

  getRepository(): Repository<SchoolAdmin> {
    return this.schoolAdminRepository;
  }

  /**
   * Delete a user record (student or teacher)
   */
  async deleteUser(
    userId: string,
    schoolId: string,
  ): Promise<{ message: string }> {
    const student = await this.studentRepository.findOne({
      where: { id: userId, school: { id: schoolId } },
    });

    if (student) {
      return this.deleteStudent(userId, schoolId);
    }

    const teacher = await this.teacherRepository.findOne({
      where: { id: userId, school: { id: schoolId } },
    });

    if (teacher) {
      return this.deleteTeacher(userId, schoolId);
    }

    throw new NotFoundException(
      `User with ID ${userId} not found in school ${schoolId}`,
    );
  }

  async deleteTeacher(
    teacherId: string,
    schoolId: string,
  ): Promise<{ message: string }> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId, school: { id: schoolId } },
      relations: ['profile'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found or not authorized');
    }

    try {
      if (teacher.profile?.avatarPath) {
        await this.objectStorageService.deleteFile(teacher.profile.avatarPath);
      }

      await this.teacherRepository.remove(teacher);

      this.logger.log(
        `Teacher ${teacherId} deleted successfully from school ${schoolId}`,
      );
      return { message: 'Teacher record deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete teacher: ${teacherId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException(
        `Failed to delete teacher: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete a student record completely
   */
  async deleteStudent(
    studentId: string,
    schoolId: string,
  ): Promise<{ message: string }> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['profile', 'parents'],
    });

    if (!student) {
      throw new NotFoundException('Student not found or not authorized');
    }

    try {
      if (student.profile?.avatarPath) {
        await this.objectStorageService.deleteFile(student.profile.avatarPath);
      }

      // Delete parent profile images if they exist
      // if (student.parents && Array.isArray(student.parents)) {
      //   for (const parent of student.parents) {
      //     if (parent.profile?.avatarPath) {
      //       await this.objectStorageService.deleteFile(
      //         parent.profile.avatarPath,
      //       );
      //     }
      //   }
      // }

      // Delete the student record and its related entities
      await this.studentRepository.remove(student);

      this.logger.log(
        `Student ${studentId} deleted successfully from school ${schoolId}`,
      );
      return { message: 'Student record deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete student: ${studentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException(
        `Failed to delete student: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getDashboardStats(schoolId: string) {
    const totalTeachers = await this.teacherRepository.count({
      where: { school: { id: schoolId }, isArchived: false },
    });

    const totalStudents = await this.studentRepository.count({
      where: { school: { id: schoolId }, isArchived: false },
    });

    const admissionRepo =
      this.schoolRepository.manager.getRepository('Admission');
    const totalApplications = await admissionRepo.count({
      where: { school: { id: schoolId }, isArchived: false },
    });

    const classLevels = await this.classLevelRepository.find({
      where: { school: { id: schoolId } },
      relations: ['students'],
    });

    let totalAttendancePercentage = 0;
    let classesWithAttendance = 0;

    const attendanceByClass: { name: string; 'Attendence-Level': number }[] =
      [];

    for (const classLevel of classLevels) {
      if (classLevel.students.length > 0) {
        const attendanceSummary =
          await this.attendanceService.getClassAttendance({
            classLevelId: classLevel.id,
            filterType: 'month',
          });

        if (attendanceSummary?.summary?.averageAttendanceRate !== undefined) {
          const rate = attendanceSummary.summary.averageAttendanceRate;

          totalAttendancePercentage += rate;
          classesWithAttendance++;

          attendanceByClass.push({
            name: classLevel.name,
            'Attendence-Level': rate,
          });
        }
      }
    }

    const averageAttendanceRate =
      classesWithAttendance > 0
        ? totalAttendancePercentage / classesWithAttendance
        : 0;

    return {
      totalTeachers,
      totalStudents,
      totalApplications,
      averageAttendanceRate,
      attendanceByClass,
    };
  }

  async findAllAssignments(schoolId: string, queryString: QueryString) {
    const baseQuery = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.teacher', 'teacher')
      .leftJoinAndSelect('assignment.topic', 'topic')
      .leftJoinAndSelect('topic.subjectCatalog', 'subjectCatalog')
      .leftJoinAndSelect('assignment.classLevel', 'classLevel')
      .leftJoinAndSelect('classLevel.students', 'students')
      .where('teacher.school.id = :schoolId', { schoolId })
      .andWhere('assignment.state = :state', { state: 'published' });

    // Extract custom filter values before passing to APIFeatures
    const classLevelId = queryString.classLevelId;
    const subjectCatalogId = queryString.subjectCatalogId;
    const teacherId = queryString.teacherId;

    // Create a copy of queryString without custom filters to avoid APIFeatures processing them
    const filteredQueryString = { ...queryString };
    delete filteredQueryString.classLevelId;
    delete filteredQueryString.subjectCatalogId;
    delete filteredQueryString.teacherId;
    // Remove search since we're handling it manually with joined tables
    const searchValue = filteredQueryString.search;
    delete filteredQueryString.search;

    // Apply custom filters for class, subject, and teacher
    if (classLevelId) {
      baseQuery.andWhere('classLevel.id = :classLevelId', {
        classLevelId,
      });
    }

    if (subjectCatalogId) {
      baseQuery.andWhere('subjectCatalog.id = :subjectCatalogId', {
        subjectCatalogId,
      });
    }

    if (teacherId) {
      baseQuery.andWhere('teacher.id = :teacherId', {
        teacherId,
      });
    }

    // Handle search across multiple fields (including joined tables)
    if (searchValue) {
      const searchTerm = `%${searchValue}%`;
      baseQuery.andWhere(
        new Brackets((qb) => {
          qb.where('assignment.title ILIKE :searchTerm', { searchTerm })
            .orWhere('topic.name ILIKE :searchTerm', { searchTerm })
            .orWhere('topic.description ILIKE :searchTerm', { searchTerm })
            .orWhere('subjectCatalog.name ILIKE :searchTerm', { searchTerm })
            .orWhere('subjectCatalog.description ILIKE :searchTerm', {
              searchTerm,
            })
            .orWhere('classLevel.name ILIKE :searchTerm', { searchTerm })
            .orWhere(
              "CONCAT(teacher.firstName, ' ', teacher.lastName) ILIKE :searchTerm",
              { searchTerm },
            )
            .orWhere('teacher.email ILIKE :searchTerm', { searchTerm });
        }),
      );
    }

    const featuresWithoutPagination = new APIFeatures(
      baseQuery.clone(),
      filteredQueryString,
    )
      .filter()
      .sort()
      .limitFields();

    const total = await featuresWithoutPagination.getQuery().getCount();

    const featuresWithPagination = featuresWithoutPagination.paginate();
    const assignments = await featuresWithPagination.getQuery().getMany();

    // Get submission counts for all assignments
    const assignmentIds = assignments.map((a) => a.id);
    const countMap = new Map<string, number>();

    if (assignmentIds.length > 0) {
      const submissionCounts = await this.assignmentSubmissionRepository
        .createQueryBuilder('submission')
        .select('submission.assignment', 'assignmentId')
        .addSelect('COUNT(submission.id)', 'count')
        .where('submission.assignment IN (:...assignmentIds)', {
          assignmentIds,
        })
        .groupBy('submission.assignment')
        .getRawMany();

      submissionCounts.forEach(
        (item: { assignmentId: string; count: string }) => {
          countMap.set(item.assignmentId, parseInt(item.count, 10));
        },
      );
    }

    // Get signed URLs for attachments and include submission counts
    const assignmentsWithAttachments = await Promise.all(
      assignments.map(async (a) => {
        let attachmentUrl: string | null = null;
        if (a.attachmentPath) {
          try {
            attachmentUrl = await this.objectStorageService.getSignedUrl(
              a.attachmentPath,
            );
          } catch (error) {
            this.logger.error(
              `Failed to get signed URL for assignment ${a.id}:`,
              error,
            );
          }
        }

        // For offline assignments, submissions count = number of students in class
        // For online assignments, submissions count = actual submission count
        let submissionsCount: number;
        if (a.assignmentType === 'offline') {
          submissionsCount = a.classLevel?.students?.length ?? 0;
        } else {
          submissionsCount = countMap.get(a.id) ?? 0;
        }

        return {
          id: a.id,
          title: a.title,
          instructions: a.instructions ?? null,
          dueDate: a.dueDate,
          maxScore: a.maxScore,
          state: a.state,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          topic: {
            id: a.topic?.id ?? null,
            name: a.topic?.name ?? null,
          },
          subject: {
            id: a.topic?.subjectCatalog?.id ?? null,
            name: a.topic?.subjectCatalog?.name ?? null,
          },
          classLevel: {
            id: a.classLevel?.id ?? null,
            name: a.classLevel?.name ?? null,
          },
          teacher: {
            id: a.teacher?.id ?? null,
            firstName: a.teacher?.firstName ?? null,
            lastName: a.teacher?.lastName ?? null,
            email: a.teacher?.email ?? null,
            teacherId: a.teacher?.teacherId ?? null,
          },
          attachmentPath: a.attachmentPath ?? null,
          attachmentUrl,
          attachmentMediaType: a.attachmentMediaType ?? null,
          submissions: submissionsCount,
          assignmentType: a.assignmentType ?? 'online',
        };
      }),
    );

    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const totalPages = Math.ceil(total / limit || 1);

    return {
      data: assignmentsWithAttachments,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  private formatOverdueTime(submittedAt: Date, dueDate: Date): string | null {
    const submitted = new Date(submittedAt);
    const due = new Date(dueDate);

    if (submitted <= due) {
      return null;
    }

    const submittedDate = new Date(
      submitted.getFullYear(),
      submitted.getMonth(),
      submitted.getDate(),
    );
    const dueDateOnly = new Date(
      due.getFullYear(),
      due.getMonth(),
      due.getDate(),
    );

    if (submittedDate.getTime() === dueDateOnly.getTime()) {
      return null;
    }

    const diffMs = submitted.getTime() - due.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    if (diffDays > 0) {
      if (remainingHours > 0) {
        return `overdue ${diffDays} day${diffDays > 1 ? 's' : ''} ${remainingHours} hr${remainingHours > 1 ? 's' : ''}`;
      }
      return `overdue ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else {
      return `overdue ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
    }
  }

  async getAssignmentStudents(
    admin: SchoolAdmin,
    assignmentId: string,
    pending?: string,
    submitted?: string,
  ): Promise<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      studentId: string;
      hasSubmitted: boolean;
      submissionId: string | null;
      status: string;
      score: number | null;
      feedback: string | null;
      submittedAt: Date | null;
      filePath: string | null;
      fileUrl: string | null;
      mediaType: string | null;
      notes: string | null;
      overDue: string | null;
      assignmentType: 'online' | 'offline';
    }>
  > {
    const manager = this.assignmentRepository.manager;
    const assignmentRepository = manager.getRepository(Assignment);
    const classLevelRepository = manager.getRepository(ClassLevel);

    const assignment = await assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['teacher', 'classLevel', 'topic', 'topic.subjectCatalog'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.teacher?.school?.id !== admin.school.id) {
      throw new NotFoundException(
        'Assignment not found or you do not have access to it',
      );
    }

    const classLevel = await classLevelRepository.findOne({
      where: { id: assignment.classLevel.id, school: { id: admin.school.id } },
      relations: ['students', 'students.profile'],
    });

    if (!classLevel) {
      throw new NotFoundException('Class level not found');
    }

    const submissionRepository = manager.getRepository(AssignmentSubmission);
    const submissions = await submissionRepository.find({
      where: { assignment: { id: assignmentId } },
      relations: ['student'],
    });

    const submissionMap = new Map<string, AssignmentSubmission>();
    submissions.forEach((sub) => {
      submissionMap.set(sub.student.id, sub);
    });

    // Automatically create submission records for offline assignments that don't have one yet
    if (assignment.assignmentType === 'offline' && classLevel.students) {
      const studentsWithoutSubmission = classLevel.students.filter(
        (student) => !submissionMap.has(student.id),
      );

      if (studentsWithoutSubmission.length > 0) {
        const newSubmissions = studentsWithoutSubmission.map((student) => {
          const submission = submissionRepository.create({
            assignment: assignment,
            student: student,
            status: 'pending',
          });
          return submission;
        });

        const savedSubmissions =
          await submissionRepository.save(newSubmissions);
        savedSubmissions.forEach((sub) => {
          submissionMap.set(sub.student.id, sub);
        });
      }
    }

    let filter: 'pending' | 'submitted' | undefined;
    if (pending !== undefined) {
      filter = 'pending';
    } else if (submitted !== undefined) {
      filter = 'submitted';
    }

    // Filter students based on query parameter
    // For offline assignments, filtering by pending/submitted doesn't apply the same way
    let filteredStudents = classLevel.students;
    if (assignment.assignmentType === 'offline') {
      // For offline assignments, all students are considered "submitted" (ready to grade)
      // There is no "pending" state for offline assignments
      if (filter === 'pending') {
        // Offline assignments don't have pending state - return empty
        filteredStudents = [];
      } else if (filter === 'submitted') {
        // For offline assignments, all students are considered "submitted"
        // Show all students (they're all ready to be graded)
        filteredStudents = classLevel.students;
      }
      // If no filter, show all students
    } else {
      // For online assignments, use existing logic
      if (filter === 'pending') {
        filteredStudents = classLevel.students.filter(
          (student) => !submissionMap.has(student.id),
        );
      } else if (filter === 'submitted') {
        filteredStudents = classLevel.students.filter((student) =>
          submissionMap.has(student.id),
        );
      }
    }

    return await Promise.all(
      filteredStudents.map(async (student) => {
        const submission = submissionMap.get(student.id);

        let status: string;
        if (!submission || !submission.status) {
          // For offline assignments, treat as "submitted" (ready to grade) even without submission
          if (assignment.assignmentType === 'offline') {
            status = 'submitted';
          } else {
            status = 'not submitted';
          }
        } else {
          const dbStatus = String(submission.status).toLowerCase();
          if (dbStatus === 'pending') {
            status = 'submitted';
          } else if (dbStatus === 'graded' || dbStatus === 'returned') {
            status = 'graded';
          } else {
            status = 'submitted';
          }
        }

        let fileUrl: string | null = null;
        let overDue: string | null = null;

        if (submission) {
          if (submission.filePath) {
            try {
              fileUrl = await this.objectStorageService.getSignedUrl(
                submission.filePath,
              );
            } catch (error) {
              this.logger.error(
                `Failed to get signed URL for submission ${submission.id}:`,
                error,
              );
            }
          }

          if (submission.createdAt) {
            overDue = this.formatOverdueTime(
              submission.createdAt,
              assignment.dueDate,
            );
          }
        }

        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          studentId: student.studentId,
          hasSubmitted: !!submission,
          submissionId: submission?.id ?? null,
          status,
          score: submission?.score ?? null,
          feedback: submission?.feedback ?? null,
          submittedAt: submission?.createdAt ?? null,
          filePath: submission?.filePath ?? null,
          fileUrl,
          mediaType: submission?.mediaType ?? null,
          notes: submission?.notes ?? null,
          overDue,
          assignmentType: assignment.assignmentType ?? 'online',
        };
      }),
    );
  }
}
