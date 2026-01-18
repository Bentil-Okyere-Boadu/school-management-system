import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Student } from 'src/student/student.entity';
import { Teacher } from 'src/teacher/teacher.entity';

/**
 * Service for retrying failed email operations
 */
@Injectable()
export class EmailRetryService {
  private readonly logger = new Logger(EmailRetryService.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  constructor(private emailService: EmailService) {}

  /**
   * Retry sending invitation email with exponential backoff
   */
  async retrySendInvitationEmail(
    admin: SchoolAdmin,
    retryCount: number = 0,
  ): Promise<void> {
    try {
      await this.emailService.sendInvitationEmail(admin);
      this.logger.log(
        `Successfully sent invitation email to ${admin.email} after ${retryCount} retries`,
      );
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(
          `Failed to send invitation email to ${admin.email}, retrying in ${this.retryDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`,
        );

        await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.retrySendInvitationEmail(admin, retryCount + 1);
      } else {
        this.logger.error(
          `Failed to send invitation email to ${admin.email} after ${this.maxRetries} retries`,
          error,
        );
        throw error;
      }
    }
  }

  /**
   * Retry sending student invitation email with exponential backoff
   */
  async retrySendStudentInvitation(
    student: Student,
    studentId: string,
    pin: string,
    retryCount: number = 0,
  ): Promise<void> {
    try {
      await this.emailService.sendStudentInvitation(student, studentId, pin);
      this.logger.log(
        `Successfully sent student invitation email to ${student.email} after ${retryCount} retries`,
      );
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(
          `Failed to send student invitation email to ${student.email}, retrying in ${this.retryDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`,
        );

        await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.retrySendStudentInvitation(
          student,
          studentId,
          pin,
          retryCount + 1,
        );
      } else {
        this.logger.error(
          `Failed to send student invitation email to ${student.email} after ${this.maxRetries} retries`,
          error,
        );
        throw error;
      }
    }
  }

  /**
   * Retry sending teacher invitation email with exponential backoff
   */
  async retrySendTeacherInvitation(
    teacher: Teacher,
    teacherId: string,
    pin: string,
    retryCount: number = 0,
  ): Promise<void> {
    try {
      await this.emailService.sendTeacherInvitation(teacher, teacherId, pin);
      this.logger.log(
        `Successfully sent teacher invitation email to ${teacher.email} after ${retryCount} retries`,
      );
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(
          `Failed to send teacher invitation email to ${teacher.email}, retrying in ${this.retryDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`,
        );

        await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.retrySendTeacherInvitation(
          teacher,
          teacherId,
          pin,
          retryCount + 1,
        );
      } else {
        this.logger.error(
          `Failed to send teacher invitation email to ${teacher.email} after ${this.maxRetries} retries`,
          error,
        );
        throw error;
      }
    }
  }

  /**
   * Utility method to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

