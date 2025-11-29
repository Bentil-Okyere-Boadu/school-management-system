import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../common/services/email.service';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { InvitationException } from '../common/exceptions/invitation.exception';
import { BaseException } from '../common/exceptions/base.exception';
import { InvitationService } from 'src/invitation/invitation.service';
import { ProfileService } from 'src/profile/profile.service';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { In } from 'typeorm';
import { Assignment } from 'src/teacher/entities/assignment.entity';
import { AssignmentSubmission } from './entities/assignment-submission.entity';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private emailService: EmailService,
    private invitationService: InvitationService,
    private readonly profileService: ProfileService,
    private objectStorageService: ObjectStorageServiceService,
  ) {}

  /**
   * Resend invitation to a student - Used by school admin
   */
  async resendStudentInvitation(
    userId: string,
    adminUser: SchoolAdmin,
  ): Promise<Student> {
    if (adminUser.role.name !== 'school_admin') {
      throw new BadRequestException(
        'Only school admins can resend invitations',
      );
    }

    if (!adminUser.school) {
      throw new BadRequestException('Admin not associated with any school');
    }

    // Find the student user
    const student = await this.studentRepository.findOne({
      where: {
        id: userId,
        status: 'pending',
        school: { id: adminUser.school.id },
      },
      relations: ['role', 'school'],
    });

    if (!student) {
      throw new NotFoundException('Pending student not found in your school');
    }

    // Generate new PIN
    const pin = this.invitationService.generatePin();

    student.invitationToken = uuidv4();
    student.invitationExpires =
      this.invitationService.calculateTokenExpiration();
    student.password = await bcrypt.hash(pin, 10);

    const updatedStudent = await this.studentRepository.save(student);

    try {
      await this.emailService.sendStudentInvitation(
        updatedStudent,
        updatedStudent.studentId,
        pin,
      );
      this.logger.log(`Invitation resent to student ${student.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to resend invitation to ${student.email}`,
        error,
      );
      throw new InvitationException(
        `Failed to resend invitation: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return updatedStudent;
  }

  /**
   * Handle forgot PIN for students
   */
  async forgotPin(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const student = await this.studentRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!student) {
      throw new NotFoundException(
        'No user found with the provided credentials',
      );
    }

    // Generate new PIN
    const pin = this.invitationService.generatePin();
    student.password = await bcrypt.hash(pin, 10);

    await this.studentRepository.save(student);

    try {
      await this.emailService.sendStudentPinReset(student, pin);
      return {
        success: true,
        message: 'PIN reset instructions sent to your email',
      };
    } catch (error) {
      this.logger.error(`Failed to send PIN reset email to ${email}`, error);
      throw new InvitationException(
        `Failed to send PIN reset email: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getMyProfile(user: Student) {
    if (!user) {
      throw new NotFoundException('no Student found');
    }

    const studentInfo = await this.studentRepository.findOne({
      where: { id: user.id },
      relations: ['role', 'profile', 'parents', 'classLevels'],
    });
    if (studentInfo?.profile?.id) {
      const profileWithUrl = await this.profileService.getProfileWithImageUrl(
        studentInfo.profile.id,
      );
      studentInfo.profile = profileWithUrl;
    }
    if (studentInfo?.school.logoPath) {
      try {
        studentInfo.school.logoUrl =
          await this.objectStorageService.getSignedUrl(
            studentInfo.school.logoPath,
          );
      } catch (error) {
        this.logger.warn(
          `Failed to get signed URL for school logo: ${studentInfo.id}${error}`,
        );
      }
    }
    return studentInfo;
  }
  async updateProfile(
    adminId: string,
    updateDto: UpdateProfileDto,
  ): Promise<Student> {
    return this.profileService.handleUpdateProfile(
      adminId,
      updateDto,
      this.studentRepository,
      ['role', 'school', 'profile'],
    );
  }

  getRepository(): Repository<Student> {
    return this.studentRepository;
  }

  async getMyAssignments(
    student: Student,
    pending?: string,
    submitted?: string,
    graded?: string,
  ) {
    let filter: 'pending' | 'submitted' | 'graded' | undefined;
    if (pending !== undefined) {
      filter = 'pending';
    } else if (submitted !== undefined) {
      filter = 'submitted';
    } else if (graded !== undefined) {
      filter = 'graded';
    }
    const me = await this.studentRepository.findOne({
      where: { id: student.id },
      relations: ['classLevels'],
    });

    if (!me) {
      throw new NotFoundException('Student not found');
    }

    const classLevelIds = me.classLevels?.map((cl) => cl.id) ?? [];
    if (classLevelIds.length === 0) {
      return [];
    }

    const manager = this.studentRepository.manager;
    const assignmentRepo = manager.getRepository(Assignment);
    const submissionRepo = manager.getRepository(AssignmentSubmission);

    const assignments = await assignmentRepo.find({
      where: { classLevel: { id: In(classLevelIds) }, state: 'published' },
      relations: ['topic', 'topic.subjectCatalog', 'teacher'],
      order: { dueDate: 'ASC' },
    });

    // Get all submissions for this student
    const submissions = await submissionRepo.find({
      where: { student: { id: student.id } },
      relations: ['assignment'],
    });

    // Create a map of assignment ID to submission
    const submissionMap = new Map<string, AssignmentSubmission>();
    submissions.forEach((sub) => {
      if (sub.assignment?.id) {
        submissionMap.set(sub.assignment.id, sub);
      }
    });

    // Filter assignments based on query parameter
    let filteredAssignments = assignments;

    if (filter === 'pending') {
      // Only assignments without submissions
      filteredAssignments = assignments.filter((a) => !submissionMap.has(a.id));
    } else if (filter === 'submitted') {
      // Only assignments with submissions that are NOT graded yet (status is 'pending' in DB)
      filteredAssignments = assignments.filter((a) => {
        const submission = submissionMap.get(a.id);
        // Strictly check that submission exists and status is exactly 'pending' (not graded or returned)
        return (
          submission &&
          submission.status &&
          String(submission.status).toLowerCase() === 'pending'
        );
      });
    } else if (filter === 'graded') {
      // Only assignments with graded or returned submissions
      filteredAssignments = assignments.filter((a) => {
        const submission = submissionMap.get(a.id);
        return (
          submission &&
          (submission.status === 'graded' || submission.status === 'returned')
        );
      });
    }

    // Map to response format
    return filteredAssignments.map((a) => {
      const submission = submissionMap.get(a.id);

      // Map status for student view:
      // - No submission: "pending" (not submitted yet)
      // - Submission with status "pending" in DB: "submitted" (submitted but not graded)
      // - Submission with status "graded" or "returned": "graded"
      let status: string;
      if (!submission || !submission.status) {
        status = 'pending'; // Not submitted yet
      } else {
        const dbStatus = String(submission.status).toLowerCase();
        if (dbStatus === 'pending') {
          status = 'submitted'; // Submitted but not graded
        } else if (dbStatus === 'graded' || dbStatus === 'returned') {
          status = 'graded'; // Graded or returned
        } else {
          status = 'submitted'; // Default to submitted for any other status
        }
      }

      return {
        id: a.id,
        assignment: a.title,
        subject: a.topic?.subjectCatalog?.name ?? null,
        teacher:
          a.teacher?.firstName || a.teacher?.lastName
            ? `${a.teacher?.firstName ?? ''} ${a.teacher?.lastName ?? ''}`.trim()
            : (a.teacher?.email ?? null),
        dueDate: a.dueDate,
        status,
        submissionId: submission?.id ?? null,
        score: submission?.score ?? null,
        feedback: submission?.feedback ?? null,
        submittedAt: submission?.createdAt ?? null,
      };
    });
  }

  async submitAssignment(
    student: Student,
    assignmentId: string,
    dto: SubmitAssignmentDto,
    file?: Express.Multer.File,
  ) {
    const manager = this.studentRepository.manager;
    const assignmentRepo = manager.getRepository(Assignment);
    const submissionRepo = manager.getRepository(AssignmentSubmission);

    // Verify assignment exists and is published
    const assignment = await assignmentRepo.findOne({
      where: { id: assignmentId },
      relations: ['classLevel'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.state !== 'published') {
      throw new BadRequestException('This assignment is not published');
    }

    // Verify student is in the assignment's class level
    const me = await this.studentRepository.findOne({
      where: { id: student.id },
      relations: ['classLevels', 'school'],
    });

    if (!me) {
      throw new NotFoundException('Student not found');
    }

    const isInClass = me.classLevels?.some(
      (cl) => cl.id === assignment.classLevel.id,
    );

    if (!isInClass) {
      throw new BadRequestException(
        'You are not enrolled in the class for this assignment',
      );
    }

    // Check if submission already exists
    const existingSubmission = await submissionRepo.findOne({
      where: {
        assignment: { id: assignmentId },
        student: { id: student.id },
      },
    });

    if (existingSubmission) {
      throw new BadRequestException(
        'You have already submitted this assignment',
      );
    }

    // Upload file if provided
    let filePath: string | null = null;
    let mediaType: string | null = null;

    if (file) {
      try {
        const uploadResult =
          await this.objectStorageService.uploadAssignmentSubmission(
            file,
            me.school.id,
            assignmentId,
            student.id,
          );
        filePath = uploadResult.path;
        mediaType = file.mimetype;
      } catch (error) {
        this.logger.error(`Failed to upload assignment file: ${error}`);
        throw new BadRequestException('Failed to upload assignment file');
      }
    }

    // Create submission
    const submission = new AssignmentSubmission();
    submission.assignment = assignment;
    submission.student = me;
    submission.filePath = filePath!;
    submission.mediaType = mediaType!;
    submission.notes = dto.notes!;
    submission.status = 'pending';

    const saved = await submissionRepo.save(submission);

    return {
      id: saved.id,
      assignment: assignment.title,
      submittedAt: saved.createdAt,
      status: 'submitted', // Map DB status 'pending' to 'submitted' for student view
      message: 'Assignment submitted successfully',
    };
  }
}
