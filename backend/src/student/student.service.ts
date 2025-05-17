import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../common/services/email.service';
import { InviteStudentDto } from '../invitation/dto/invite-student.dto';
import * as crypto from 'crypto';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { InvitationException } from '../common/exceptions/invitation.exception';
import { BaseException } from '../common/exceptions/base.exception';
import { InvitationService } from 'src/invitation/invitation.service';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private emailService: EmailService,
    private invitationService: InvitationService,
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
      // For security reasons, don't reveal that the user doesn't exist
      return {
        success: true,
        message: 'If your email is registered, you will receive a PIN reset',
      };
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
}
