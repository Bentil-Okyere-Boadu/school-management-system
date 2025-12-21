import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { InvitationService } from 'src/invitation/invitation.service';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { Student } from 'src/student/student.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { Subject } from 'src/subject/subject.entity';
import { SubjectCatalog } from 'src/subject/subject-catalog.entity';
import { Topic } from 'src/curriculum/entities/topic.entity';
import { In } from 'typeorm';
import { CreateTeacherTopicDto } from './dto/create-teacher-topic.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { Assignment } from './entities/assignment.entity';
import { UpdateTeacherTopicDto } from './dto/update-teacher-topic.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AssignmentSubmission } from 'src/student/entities/assignment-submission.entity';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { Parent } from 'src/parent/parent.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { QueryString } from 'src/common/api-features/api-features';
import { APIFeatures } from 'src/common/api-features/api-features';
import { ProfileService } from 'src/profile/profile.service';
import { AcademicCalendarService } from 'src/academic-calendar/academic-calendar.service';

@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
    private emailService: EmailService,
    private invitationService: InvitationService,
    private readonly profileService: ProfileService,
    private readonly objectStorageService: ObjectStorageServiceService,
    private readonly academicCalendarService: AcademicCalendarService,
  ) {}

  async resendTeacherInvitation(
    userId: string,
    adminUser: SchoolAdmin,
  ): Promise<Teacher> {
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException(
        'Only school admins can resend invitations',
      );
    }
    if (!adminUser.school) {
      throw new BadRequestException('Admin not associated with any school');
    }
    const teacher = await this.teacherRepository.findOne({
      where: {
        id: userId,
        status: 'pending',
        school: { id: adminUser.school.id },
      },
      relations: ['role', 'school'],
    });
    if (!teacher) {
      throw new NotFoundException('Pending teacher not found in your school');
    }
    const pin = this.invitationService.generatePin();
    teacher.invitationToken = uuidv4();
    teacher.invitationExpires =
      this.invitationService.calculateTokenExpiration();
    teacher.password = await bcrypt.hash(pin, 10);
    const updatedTeacher = await this.teacherRepository.save(teacher);
    try {
      await this.emailService.sendTeacherInvitation(
        updatedTeacher,
        updatedTeacher.teacherId,
        pin,
      );
    } catch (error) {}
    return updatedTeacher;
  }

  async forgotPin(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const teacher = await this.teacherRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!teacher) {
      throw new NotFoundException(
        'No user found with the provided credentials',
      );
    }
    const pin = this.invitationService.generatePin();
    teacher.password = await bcrypt.hash(pin, 10);
    await this.teacherRepository.save(teacher);
    try {
      await this.emailService.sendTeacherPinReset(teacher, pin);
      return {
        success: true,
        message: 'PIN reset instructions sent to your email',
      };
    } catch (error) {
      throw new BadRequestException('Failed to send PIN reset email');
    }
  }
  async updateProfile(
    adminId: string,
    updateDto: UpdateProfileDto,
  ): Promise<Teacher> {
    return this.profileService.handleUpdateProfile(
      adminId,
      updateDto,
      this.teacherRepository,
      ['role', 'school', 'profile'],
    );
  }

  getRepository(): Repository<Teacher> {
    return this.teacherRepository;
  }

  async getMyProfile(user: Teacher) {
    if (!user) {
      throw new NotFoundException('no Teacher found');
    }

    const teacherInfo = await this.teacherRepository.findOne({
      where: { id: user.id },
      relations: ['role', 'profile'],
    });
    if (teacherInfo?.profile?.id) {
      const profileWithUrl = await this.profileService.getProfileWithImageUrl(
        teacherInfo.profile.id,
      );
      teacherInfo.profile = profileWithUrl;
    }

    return teacherInfo;
  }

  async checkIfClassTeacher(
    userId: string,
    classLevelId?: string,
    studentId?: string,
  ): Promise<{ isClassTeacher: boolean }> {
    if (classLevelId) {
      const classLevel = await this.teacherRepository.manager
        .getRepository(ClassLevel)
        .createQueryBuilder('classLevel')
        .leftJoin('classLevel.classTeacher', 'classTeacher')
        .where('classLevel.id = :id', { id: classLevelId })
        .select(['classLevel.id', 'classTeacher.id'])
        .getOne();

      if (!classLevel) {
        return { isClassTeacher: false };
      }

      return { isClassTeacher: classLevel?.classTeacher?.id === userId };
    }

    if (studentId) {
      const student = await this.teacherRepository.manager
        .getRepository(Student)
        .findOne({
          where: { id: studentId },
          relations: ['classLevels', 'classLevels.classTeacher'],
        });

      if (!student) {
        return { isClassTeacher: false };
      }

      const isClassTeacher = student.classLevels.some(
        (classLevel) => classLevel?.classTeacher?.id === userId,
      );

      return { isClassTeacher };
    }

    return { isClassTeacher: false };
  }

  async getMySubjectCatalogs(teacherId: string) {
    const subjectRepository =
      this.teacherRepository.manager.getRepository(Subject);

    const subjects = await subjectRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['subjectCatalog'],
    });

    const uniqueById = new Map<string, SubjectCatalog>();
    for (const s of subjects) {
      if (s.subjectCatalog?.id && !uniqueById.has(s.subjectCatalog.id)) {
        uniqueById.set(s.subjectCatalog.id, s.subjectCatalog);
      }
    }

    return Array.from(uniqueById.values());
  }

  async getMyTopics(teacherId: string) {
    const subjectRepository =
      this.teacherRepository.manager.getRepository(Subject);
    const topicRepository = this.teacherRepository.manager.getRepository(Topic);

    const subjects = await subjectRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['subjectCatalog'],
    });

    const subjectCatalogIds = Array.from(
      new Set(
        subjects
          .map((s) => s.subjectCatalog?.id)
          .filter((id): id is string => !!id),
      ),
    );

    if (subjectCatalogIds.length === 0) {
      return [];
    }

    const topics = await topicRepository.find({
      where: { subjectCatalog: { id: In(subjectCatalogIds) } },
      order: { order: 'ASC' },
      relations: ['subjectCatalog', 'curriculum'],
    });

    return topics;
  }

  async createTopic(teacher: Teacher, dto: CreateTeacherTopicDto) {
    const subjectRepository =
      this.teacherRepository.manager.getRepository(Subject);
    const subjectCatalogRepository =
      this.teacherRepository.manager.getRepository(SubjectCatalog);
    const topicRepository = this.teacherRepository.manager.getRepository(Topic);

    // Ensure teacher has this subjectCatalog assigned via Subject
    const subject = await subjectRepository.findOne({
      where: {
        teacher: { id: teacher.id },
        subjectCatalog: { id: dto.subjectCatalogId },
      },
      relations: ['subjectCatalog'],
    });

    if (!subject) {
      throw new NotFoundException(
        'You are not assigned to this subject catalog',
      );
    }

    const subjectCatalog = await subjectCatalogRepository.findOne({
      where: { id: dto.subjectCatalogId },
      relations: ['curricula'],
    });

    if (!subjectCatalog) {
      throw new NotFoundException('Subject catalog not found');
    }

    const createdByName = `${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`
      .trim()
      .replace(/\s+/g, ' ');

    const activeOrFirstCurriculum =
      subjectCatalog.curricula?.find((c) => c.isActive) ??
      subjectCatalog.curricula?.[0];

    const topic = topicRepository.create({
      name: dto.name,
      description: dto.description,
      subjectCatalog,
      curriculum: activeOrFirstCurriculum,
      createdBy: `Teacher - ${createdByName || teacher.email}`,
    });

    return topicRepository.save(topic);
  }

  async createAssignment(
    teacher: Teacher,
    dto: CreateAssignmentDto,
    file?: Express.Multer.File,
  ) {
    const manager = this.teacherRepository.manager;
    const topicRepository = manager.getRepository(Topic);
    const classLevelRepository = manager.getRepository(ClassLevel);
    const subjectRepository = manager.getRepository(Subject);
    const assignmentRepository = manager.getRepository(Assignment);

    // Get teacher with school relation
    const teacherWithSchool = await this.teacherRepository.findOne({
      where: { id: teacher.id },
      relations: ['school'],
    });

    if (!teacherWithSchool?.school) {
      throw new NotFoundException('Teacher school not found');
    }

    const [topic, classLevel] = await Promise.all([
      topicRepository.findOne({
        where: { id: dto.topicId },
        relations: ['subjectCatalog', 'curriculum'],
      }),
      classLevelRepository.findOne({
        where: { id: dto.classLevelId },
        relations: ['students', 'students.parents'],
      }),
    ]);

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }
    if (!classLevel) {
      throw new NotFoundException('Class level not found');
    }

    // Ensure teacher is assigned to the subject (subjectCatalog) for this topic
    const subject = await subjectRepository.findOne({
      where: {
        teacher: { id: teacher.id },
        subjectCatalog: { id: topic.subjectCatalog.id },
      },
      relations: ['classLevels'],
    });

    if (!subject) {
      throw new NotFoundException('You are not assigned to this subject');
    }

    // Ensure class level is among the subject's class levels
    const allowedClassLevelIds = new Set(
      subject.classLevels.map((cl) => cl.id),
    );
    if (!allowedClassLevelIds.has(classLevel.id)) {
      throw new NotFoundException(
        'You are not assigned to this class level for the selected subject',
      );
    }

    // Create assignment first to get the ID for file upload path
    const assignment = assignmentRepository.create({
      title: dto.title,
      instructions: dto.instructions,
      dueDate: new Date(dto.dueDate),
      maxScore: +dto.maxScore,
      state: dto.state,
      assignmentType: dto.assignmentType ?? 'online',
      topic,
      classLevel,
      teacher: { id: teacher.id } as Teacher,
    });

    const savedAssignment = await assignmentRepository.save(assignment);

    // Upload file if provided
    if (file) {
      try {
        const uploadResult =
          await this.objectStorageService.uploadAssignmentAttachment(
            file,
            teacherWithSchool.school.id,
            savedAssignment.id,
          );
        savedAssignment.attachmentPath = uploadResult.path;
        savedAssignment.attachmentMediaType = file.mimetype;
        await assignmentRepository.save(savedAssignment);
      } catch (error) {
        // If file upload fails, delete the created assignment
        await assignmentRepository.delete(savedAssignment.id);
        this.logger.error(
          `Failed to upload assignment attachment for assignment ${savedAssignment.id}: ${error}`,
        );
        throw new BadRequestException('Failed to upload assignment attachment');
      }
    }

    if (savedAssignment.state === 'published') {
      this.notifyParentsAboutAssignment(savedAssignment, classLevel, topic);
    }

    return savedAssignment;
  }

  private async notifyParentsAboutAssignment(
    assignment: Assignment,
    classLevel: ClassLevel,
    topic: Topic,
  ): Promise<void> {
    if (!classLevel.students || classLevel.students.length === 0) {
      return;
    }

    const dueDateFormatted = new Date(assignment.dueDate).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    const emailPromises: Promise<void>[] = [];

    for (const student of classLevel.students) {
      if (!student.parents || student.parents.length === 0) {
        continue;
      }

      const studentName =
        `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() ||
        student.email;

      for (const parent of student.parents) {
        if (!parent.email) {
          continue;
        }

        const parentName =
          `${parent.firstName ?? ''} ${parent.lastName ?? ''}`.trim() ||
          parent.email;

        const emailPromise = this.emailService
          .sendAssignmentPublishedEmail(
            parent.email,
            parentName,
            studentName,
            classLevel.name,
            assignment.title,
            topic.subjectCatalog?.name ?? 'Unknown Subject',
            dueDateFormatted,
            assignment.instructions ?? undefined,
          )
          .catch((error) => {
            this.logger.error(
              `Failed to send assignment notification to parent ${parent.id} for student ${student.id}: ${error}`,
            );
          });

        emailPromises.push(emailPromise);
      }
    }

    await Promise.allSettled(emailPromises);
  }

  async getMyAssignments(teacherId: string) {
    const manager = this.teacherRepository.manager;
    const assignmentRepository = manager.getRepository(Assignment);
    const submissionRepository = manager.getRepository(AssignmentSubmission);

    const assignments = await assignmentRepository.find({
      where: { teacher: { id: teacherId } },
      relations: [
        'topic',
        'topic.subjectCatalog',
        'classLevel',
        'classLevel.students',
      ],
      order: { dueDate: 'ASC' },
    });

    // Get submission counts for all assignments
    const assignmentIds = assignments.map((a) => a.id);

    // If no assignments, return empty array early to avoid SQL syntax error with IN ()
    if (assignmentIds.length === 0) {
      return [];
    }

    const submissionCounts = await submissionRepository
      .createQueryBuilder('submission')
      .select('submission.assignment', 'assignmentId')
      .addSelect('COUNT(submission.id)', 'count')
      .where('submission.assignment IN (:...assignmentIds)', {
        assignmentIds,
      })
      .groupBy('submission.assignment')
      .getRawMany();

    const countMap = new Map<string, number>();
    submissionCounts.forEach(
      (item: { assignmentId: string; count: string }) => {
        countMap.set(item.assignmentId, parseInt(item.count, 10));
      },
    );

    // Get signed URLs for attachments
    const assignmentsWithAttachments = await Promise.all(
      assignments.map(async (a) => {
        let attachmentUrl: string | null = null;
        if (a.attachmentPath) {
          try {
            attachmentUrl = await this.objectStorageService.getSignedUrl(
              a.attachmentPath,
            );
          } catch (error) {
            console.error(
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
          topic: a.topic?.name ?? null,
          topicId: a.topic?.id ?? null,
          dueDate: a.dueDate,
          status: a.state,
          submissions: submissionsCount,
          maxScore: a.maxScore,
          class: a.classLevel?.name ?? null,
          classLevelId: a.classLevel?.id ?? null,
          attachmentPath: a.attachmentPath,
          attachmentUrl,
          attachmentMediaType: a.attachmentMediaType ?? null,
          assignmentType: a.assignmentType ?? 'online',
        };
      }),
    );

    return assignmentsWithAttachments;
  }

  private isCreatedByTeacher(teacher: Teacher, topic: Topic): boolean {
    if (!topic.createdBy) return false;
    return topic.createdBy.startsWith('Teacher -');
  }

  async updateTeacherTopic(
    teacher: Teacher,
    topicId: string,
    dto: UpdateTeacherTopicDto,
  ) {
    const manager = this.teacherRepository.manager;
    const topicRepo = manager.getRepository(Topic);
    const subjectCatalogRepo = manager.getRepository(SubjectCatalog);
    const subjectRepo = manager.getRepository(Subject);

    const topic = await topicRepo.findOne({
      where: { id: topicId },
      relations: ['subjectCatalog', 'curriculum'],
    });
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (!this.isCreatedByTeacher(teacher, topic)) {
      throw new BadRequestException('You can only edit topics you created');
    }

    if (dto.name !== undefined) topic.name = dto.name;
    if (dto.description !== undefined) topic.description = dto.description;

    if (
      dto.subjectCatalogId &&
      dto.subjectCatalogId !== topic.subjectCatalog.id
    ) {
      // Ensure teacher is assigned to this subjectCatalog
      const subject = await subjectRepo.findOne({
        where: {
          teacher: { id: teacher.id },
          subjectCatalog: { id: dto.subjectCatalogId },
        },
      });
      if (!subject) {
        throw new BadRequestException(
          'You are not assigned to the selected subject catalog',
        );
      }

      const newCatalog = await subjectCatalogRepo.findOne({
        where: { id: dto.subjectCatalogId },
        relations: ['curricula'],
      });
      if (!newCatalog) {
        throw new NotFoundException('Subject catalog not found');
      }

      topic.subjectCatalog = newCatalog;
      // auto-select curriculum (active > first)
      topic.curriculum =
        newCatalog.curricula?.find((c) => c.isActive) ??
        newCatalog.curricula?.[0] ??
        null;
    }

    return topicRepo.save(topic);
  }

  async deleteTeacherTopic(teacher: Teacher, topicId: string) {
    const manager = this.teacherRepository.manager;
    const topicRepo = manager.getRepository(Topic);
    const assignmentRepo = manager.getRepository(Assignment);

    const topic = await topicRepo.findOne({
      where: { id: topicId },
    });
    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (!this.isCreatedByTeacher(teacher, topic)) {
      throw new BadRequestException('You can only delete topics you created');
    }

    const assignmentCount = await assignmentRepo.count({
      where: { topic: { id: topic.id } },
    });
    if (assignmentCount > 0) {
      throw new BadRequestException(
        'This topic has assignments. Delete related assignments before deleting the topic',
      );
    }

    await topicRepo.delete(topic.id);
    return { success: true, message: 'Topic deleted successfully' };
  }

  async updateAssignment(
    teacher: Teacher,
    assignmentId: string,
    dto: UpdateAssignmentDto,
    file?: Express.Multer.File,
  ) {
    const manager = this.teacherRepository.manager;
    const assignmentRepository = manager.getRepository(Assignment);

    // Get teacher with school relation
    const teacherWithSchool = await this.teacherRepository.findOne({
      where: { id: teacher.id },
      relations: ['school'],
    });

    if (!teacherWithSchool?.school) {
      throw new NotFoundException('Teacher school not found');
    }

    const assignment = await assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['teacher', 'classLevel', 'topic', 'topic.subjectCatalog'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    if (assignment.teacher?.id !== teacher.id) {
      throw new BadRequestException(
        'You can only edit assignments you created',
      );
    }

    const previousState = assignment.state;

    if (dto.title !== undefined) assignment.title = dto.title;
    if (dto.instructions !== undefined)
      assignment.instructions = dto.instructions;
    if (dto.dueDate !== undefined) assignment.dueDate = new Date(dto.dueDate);
    if (dto.maxScore !== undefined) assignment.maxScore = dto.maxScore;
    if (dto.state !== undefined) assignment.state = dto.state;
    if (dto.assignmentType !== undefined)
      assignment.assignmentType = dto.assignmentType;

    // Handle file upload/update
    if (file) {
      // Delete old file if exists
      if (assignment.attachmentPath) {
        try {
          await this.objectStorageService.deleteFile(assignment.attachmentPath);
        } catch (error) {
          // Log error but don't fail the update
          console.error('Failed to delete old attachment:', error);
        }
      }

      // Upload new file
      try {
        const uploadResult =
          await this.objectStorageService.uploadAssignmentAttachment(
            file,
            teacherWithSchool.school.id,
            assignment.id,
          );
        assignment.attachmentPath = uploadResult.path;
        assignment.attachmentMediaType = file.mimetype;
      } catch (error) {
        this.logger.error('Failed to upload assignment attachment:', error);
        throw new BadRequestException('Failed to upload assignment attachment');
      }
    }

    const savedAssignment = await assignmentRepository.save(assignment);

    if (previousState === 'draft' && savedAssignment.state === 'published') {
      const classLevelRepository = manager.getRepository(ClassLevel);
      const classLevelWithStudents = await classLevelRepository.findOne({
        where: { id: savedAssignment.classLevel.id },
        relations: ['students', 'students.parents'],
      });

      if (classLevelWithStudents) {
        this.notifyParentsAboutAssignment(
          savedAssignment,
          classLevelWithStudents,
          savedAssignment.topic,
        );
      }
    }

    return savedAssignment;
  }

  async deleteAssignment(teacher: Teacher, assignmentId: string) {
    const manager = this.teacherRepository.manager;
    const assignmentRepository = manager.getRepository(Assignment);

    const assignment = await assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['teacher'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    if (assignment.teacher?.id !== teacher.id) {
      throw new BadRequestException(
        'You can only delete assignments you created',
      );
    }

    // Delete attachment file if exists
    if (assignment.attachmentPath) {
      try {
        await this.objectStorageService.deleteFile(assignment.attachmentPath);
      } catch (error) {
        // Log error but don't fail the deletion
        console.error('Failed to delete assignment attachment:', error);
      }
    }

    await assignmentRepository.delete(assignment.id);
    return { success: true, message: 'Assignment deleted successfully' };
  }

  async getAssignmentStudents(
    teacher: Teacher,
    assignmentId: string,
    pending?: string,
    submitted?: string,
    sort?: string,
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
      termAggregatedScore?: number;
      assignmentType: 'online' | 'offline';
    }>
  > {
    const manager = this.teacherRepository.manager;
    const assignmentRepository = manager.getRepository(Assignment);
    const classLevelRepository = manager.getRepository(ClassLevel);

    // Verify assignment exists and belongs to teacher
    const assignment = await assignmentRepository.findOne({
      where: { id: assignmentId, teacher: { id: teacher.id } },
      relations: ['classLevel'],
    });

    if (!assignment) {
      throw new NotFoundException(
        'Assignment not found or you do not have access to it',
      );
    }

    // Get all students in the assignment's class level
    const classLevel = await classLevelRepository.findOne({
      where: { id: assignment.classLevel.id },
      relations: ['students', 'students.role'],
    });

    if (!classLevel) {
      throw new NotFoundException('Class level not found');
    }

    // Get submissions for this assignment to show submission status
    const submissionRepository = manager.getRepository(AssignmentSubmission);
    const submissions = await submissionRepository.find({
      where: { assignment: { id: assignmentId } },
      relations: ['student'],
    });

    const submissionMap = new Map<string, AssignmentSubmission>();
    submissions.forEach((sub) => {
      submissionMap.set(sub.student.id, sub);
    });

    // Determine filter based on query parameters
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
        // Only students without submissions
        filteredStudents = classLevel.students.filter(
          (student) => !submissionMap.has(student.id),
        );
      } else if (filter === 'submitted') {
        // Only students with submissions
        filteredStudents = classLevel.students.filter((student) =>
          submissionMap.has(student.id),
        );
      }
    }

    // Get current/latest term for term scores
    let term: AcademicTerm | null = null;
    try {
      const teacherWithSchool = await this.teacherRepository.findOne({
        where: { id: teacher.id },
        relations: ['school'],
      });

      if (teacherWithSchool?.school) {
        const calendar =
          await this.academicCalendarService.getCurrentAcademicCalendar(
            teacherWithSchool.school.id,
          );
        if (calendar) {
          term = await this.academicCalendarService.getLatestTerm(calendar.id);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to get current term for term scores:', error);
    }

    // Calculate term scores if term is available
    const termScoresMap = new Map<string, number>();
    if (term) {
      const termStartDate = new Date(term.startDate);
      const termEndDate = new Date(term.endDate);
      termEndDate.setHours(23, 59, 59, 999);

      // Get all assignments by this teacher in this term
      const allAssignments = await assignmentRepository.find({
        where: {
          teacher: { id: teacher.id },
          state: 'published',
          classLevel: { id: assignment.classLevel.id },
        },
        relations: ['classLevel'],
      });

      const termAssignments = allAssignments.filter((a) => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= termStartDate && dueDate <= termEndDate;
      });

      if (termAssignments.length > 0) {
        const termAssignmentIds = termAssignments.map((a) => a.id);
        const termSubmissions = await submissionRepository.find({
          where: {
            assignment: { id: In(termAssignmentIds) },
          },
          relations: ['assignment', 'student'],
        });

        // Group submissions by student
        const studentTermSubmissions = new Map<
          string,
          AssignmentSubmission[]
        >();
        termSubmissions.forEach((sub) => {
          if (!studentTermSubmissions.has(sub.student.id)) {
            studentTermSubmissions.set(sub.student.id, []);
          }
          studentTermSubmissions.get(sub.student.id)!.push(sub);
        });

        // Calculate scores for each student
        filteredStudents.forEach((student) => {
          const submissions = studentTermSubmissions.get(student.id) || [];
          let totalScore = 0;
          let totalMaxScore = 0;
          let completedAssignments = 0;

          termAssignments.forEach((termAssignment) => {
            totalMaxScore += termAssignment.maxScore;
            const submission = submissions.find(
              (s) => s.assignment.id === termAssignment.id,
            );
            if (submission && submission.score !== null) {
              totalScore += submission.score;
              completedAssignments++;
            }
          });

          const averagePercentage =
            totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

          termScoresMap.set(
            student.id,
            Math.round(averagePercentage * 100) / 100,
          );
        });
      }
    }

    const studentsWithSubmissions = filteredStudents.map((student) => {
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

      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        studentId: student.studentId,
        isArchived: student.isArchived,
        archivedAt: student.isArchived ? student.updatedAt : null,
        hasSubmitted: !!submission,
        submissionId: submission?.id ?? null,
        status,
        score: submission?.score ?? null,
        feedback: submission?.feedback ?? null,
        submittedAt: submission?.createdAt ?? null,
        termAggregatedScore: termScoresMap.get(student.id) ?? undefined,
        assignmentType: assignment.assignmentType ?? 'online',
      };
    });

    if (sort === 'score' || sort === 'score_asc') {
      return studentsWithSubmissions.sort((a, b) => {
        const scoreA = a.score ?? -1;
        const scoreB = b.score ?? -1;
        return scoreA - scoreB;
      });
    } else if (sort === 'score_desc') {
      return studentsWithSubmissions.sort((a, b) => {
        const scoreA = a.score ?? -1;
        const scoreB = b.score ?? -1;
        return scoreB - scoreA;
      });
    }

    return studentsWithSubmissions;
  }

  private formatOverdueTime(submittedAt: Date, dueDate: Date): string | null {
    const submitted = new Date(submittedAt);
    const due = new Date(dueDate);

    // If submitted before or on due date, not overdue
    if (submitted <= due) {
      return null;
    }

    // Check if submitted on the same day as due date (not overdue if same day)
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

    // If same day, not overdue
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

  async getStudentSubmission(
    teacher: Teacher,
    assignmentId: string,
    studentId: string,
  ) {
    const manager = this.teacherRepository.manager;
    const assignmentRepository = manager.getRepository(Assignment);
    const submissionRepository = manager.getRepository(AssignmentSubmission);
    const studentRepository = manager.getRepository(Student);

    // Verify assignment exists and belongs to teacher
    const assignment = await assignmentRepository.findOne({
      where: { id: assignmentId, teacher: { id: teacher.id } },
      relations: ['classLevel', 'topic', 'topic.subjectCatalog'],
    });

    if (!assignment) {
      throw new NotFoundException(
        'Assignment not found or you do not have access to it',
      );
    }

    // Verify student is in the assignment's class level
    const student = await studentRepository.findOne({
      where: { id: studentId },
      relations: ['classLevels'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const isInClass = student.classLevels?.some(
      (cl) => cl.id === assignment.classLevel.id,
    );

    if (!isInClass) {
      throw new BadRequestException(
        'Student is not enrolled in the class for this assignment',
      );
    }

    // Get submission
    const submission = await submissionRepository.findOne({
      where: {
        assignment: { id: assignmentId },
        student: { id: studentId },
      },
      relations: ['assignment', 'student'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Get signed URL for file if exists
    let fileUrl: string | null = null;
    if (submission.filePath) {
      try {
        fileUrl = await this.objectStorageService.getSignedUrl(
          submission.filePath,
        );
      } catch (error) {
        // Log error but don't fail the request
        console.error('Failed to get signed URL for submission file:', error);
      }
    }

    // Get signed URL for assignment attachment if exists
    let assignmentAttachmentUrl: string | null = null;
    if (assignment.attachmentPath) {
      try {
        assignmentAttachmentUrl = await this.objectStorageService.getSignedUrl(
          assignment.attachmentPath,
        );
      } catch (error) {
        console.error(
          'Failed to get signed URL for assignment attachment:',
          error,
        );
      }
    }

    // Calculate overdue time
    const overDue = this.formatOverdueTime(
      submission.createdAt,
      assignment.dueDate,
    );

    return {
      id: submission.id,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        instructions: assignment.instructions ?? null,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        topic: assignment.topic?.name ?? null,
        subject: assignment.topic?.subjectCatalog?.name ?? null,
        attachmentPath: assignment.attachmentPath ?? null,
        attachmentUrl: assignmentAttachmentUrl,
        attachmentMediaType: assignment.attachmentMediaType ?? null,
      },
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        studentId: student.studentId,
      },
      filePath: submission.filePath,
      fileUrl,
      mediaType: submission.mediaType,
      notes: submission.notes,
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
      submittedAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      overDue,
    };
  }

  async gradeSubmission(
    teacher: Teacher,
    assignmentId: string,
    studentId: string,
    dto: GradeSubmissionDto,
  ): Promise<{
    id: string;
    assignment: string;
    student: string;
    score: number;
    feedback: string | null;
    status: string;
    message: string;
  }> {
    const manager = this.teacherRepository.manager;
    const assignmentRepository = manager.getRepository(Assignment);
    const submissionRepository = manager.getRepository(AssignmentSubmission);
    const studentRepository = manager.getRepository(Student);

    // Verify assignment exists and belongs to teacher
    const assignment = await assignmentRepository.findOne({
      where: { id: assignmentId, teacher: { id: teacher.id } },
      relations: ['classLevel'],
    });

    if (!assignment) {
      throw new NotFoundException(
        'Assignment not found or you do not have access to it',
      );
    }

    // Verify student is in the assignment's class level
    const student = await studentRepository.findOne({
      where: { id: studentId },
      relations: ['classLevels'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const isInClass = student.classLevels?.some(
      (cl) => cl.id === assignment.classLevel.id,
    );

    if (!isInClass) {
      throw new BadRequestException(
        'Student is not enrolled in the class for this assignment',
      );
    }

    // Verify score doesn't exceed max score
    if (dto.score > assignment.maxScore) {
      throw new BadRequestException(
        `Score cannot exceed maximum score of ${assignment.maxScore}`,
      );
    }

    // Get or create submission
    let submission = await submissionRepository.findOne({
      where: {
        assignment: { id: assignmentId },
        student: { id: studentId },
      },
    });

    // For offline assignments, create submission if it doesn't exist
    if (!submission && assignment.assignmentType === 'offline') {
      const newSubmission = submissionRepository.create({
        assignment: assignment,
        student: student,
        status: 'pending',
      });
      submission = await submissionRepository.save(newSubmission);
    } else if (!submission) {
      throw new NotFoundException(
        'Submission not found. Student must submit the assignment first.',
      );
    }

    // Update submission with grade
    submission.score = dto.score;
    if (dto.feedback !== undefined) {
      submission.feedback = dto.feedback;
    }
    if (dto.status) {
      submission.status = dto.status;
    } else {
      submission.status = 'graded';
    }

    const saved = await submissionRepository.save(submission);

    return {
      id: saved.id,
      assignment: assignment.title,
      student: `${student.firstName} ${student.lastName}`,
      score: saved.score,
      feedback: saved.feedback,
      status: saved.status,
      message: 'Submission graded successfully',
    };
  }

  async findMyStudents(teacher: Teacher, queryString: QueryString) {
    const teacherWithRelations = await this.teacherRepository.findOne({
      where: { id: teacher.id },
      relations: ['classLevels', 'school'],
    });

    if (!teacherWithRelations) {
      throw new NotFoundException('Teacher not found');
    }

    const assignedClassIds = teacherWithRelations.classLevels?.map((cl) => cl.id) || [];
    const classesAsClassTeacher = await this.classLevelRepository.find({
      where: { classTeacher: { id: teacher.id } },
      select: ['id'],
    });
    const classTeacherIds = classesAsClassTeacher.map((cl) => cl.id);
    const uniqueClassLevelIds = [...new Set([...assignedClassIds, ...classTeacherIds])];

    if (uniqueClassLevelIds.length === 0) {
      const page = parseInt(queryString.page ?? '1', 10);
      const limit = parseInt(queryString.limit ?? '20', 10);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const baseQuery = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.role', 'role')
      .leftJoinAndSelect('student.school', 'school')
      .leftJoinAndSelect('student.classLevels', 'classLevel')
      .leftJoinAndSelect('student.profile', 'profile')
      .where('student.school.id = :schoolId', {
        schoolId: teacherWithRelations.school.id,
      })
      .andWhere('student.isArchived = :isArchived', { isArchived: false })
      .andWhere('classLevel.id IN (:...classLevelIds)', {
        classLevelIds: uniqueClassLevelIds,
      });

    const features = new APIFeatures(baseQuery.clone(), queryString)
      .filter()
      .sort()
      .search(['firstName', 'lastName', 'email'])
      .limitFields();

    const total = await features.getQuery().getCount();
    const students = await features.paginate().getQuery().getMany();

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
      meta: { total, page, limit, totalPages },
    };
  }
}
