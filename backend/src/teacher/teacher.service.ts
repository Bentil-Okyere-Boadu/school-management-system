import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { InvitationService } from 'src/invitation/invitation.service';
import { ProfileService } from 'src/profile/profile.service';
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

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    private emailService: EmailService,
    private invitationService: InvitationService,
    private readonly profileService: ProfileService,
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

  async createAssignment(teacher: Teacher, dto: CreateAssignmentDto) {
    const manager = this.teacherRepository.manager;
    const topicRepository = manager.getRepository(Topic);
    const classLevelRepository = manager.getRepository(ClassLevel);
    const subjectRepository = manager.getRepository(Subject);
    const assignmentRepository = manager.getRepository(Assignment);

    const [topic, classLevel] = await Promise.all([
      topicRepository.findOne({
        where: { id: dto.topicId },
        relations: ['subjectCatalog', 'curriculum'],
      }),
      classLevelRepository.findOne({ where: { id: dto.classLevelId } }),
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

    const assignment = assignmentRepository.create({
      title: dto.title,
      instructions: dto.instructions,
      dueDate: new Date(dto.dueDate),
      maxScore: dto.maxScore,
      state: dto.state,
      topic,
      classLevel,
      teacher: { id: teacher.id } as Teacher,
    });

    return assignmentRepository.save(assignment);
  }

  async getMyAssignments(teacherId: string) {
    const manager = this.teacherRepository.manager;
    const assignmentRepository = manager.getRepository(Assignment);

    const assignments = await assignmentRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['topic', 'topic.subjectCatalog', 'classLevel'],
      order: { dueDate: 'ASC' },
    });

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      instructions: a.instructions ?? null,
      topic: a.topic?.name ?? null,
      topicId: a.topic?.id ?? null,
      dueDate: a.dueDate,
      status: a.state,
      submissions: 0, // TODO: replace with real submissions count when implemented
      maxScore: a.maxScore,
      class: a.classLevel?.name ?? null,
      classLevelId: a.classLevel?.id ?? null,
    }));
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
  ) {
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
        'You can only edit assignments you created',
      );
    }

    if (dto.title !== undefined) assignment.title = dto.title;
    if (dto.instructions !== undefined)
      assignment.instructions = dto.instructions;
    if (dto.dueDate !== undefined) assignment.dueDate = new Date(dto.dueDate);
    if (dto.maxScore !== undefined) assignment.maxScore = dto.maxScore;
    if (dto.state !== undefined) assignment.state = dto.state;

    return assignmentRepository.save(assignment);
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

    await assignmentRepository.delete(assignment.id);
    return { success: true, message: 'Assignment deleted successfully' };
  }
}
