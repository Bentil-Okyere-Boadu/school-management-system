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

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a random PIN
   */
  private generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a random invitation token
   */
  private generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate token expiration date (24 hours from now)
   */
  private calculateTokenExpiration(): Date {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);
    return expirationDate;
  }

  /**
   * Extract school initials from name
   * Gets first letter of each word, up to 3 letters
   * If the school name has fewer than 3 words, it uses the second letter of the first word
   */
  private getSchoolInitials(schoolName: string): string {
    const words = schoolName.trim().split(/\s+/);

    if (words.length === 0 || words[0].length === 0) {
      return 'XXX'; // Fallback for empty names
    }

    let initials = '';

    // Get first letter of each word
    for (let i = 0; i < Math.min(words.length, 3); i++) {
      if (words[i] && words[i].length > 0) {
        initials += words[i].charAt(0).toUpperCase();
      }
    }

    // If we have fewer than 3 letters and the first word has more than 1 character,
    // add the second letter of the first word
    if (initials.length < 3 && words[0].length > 1) {
      initials += words[0].charAt(1).toUpperCase();
    }

    // Ensure we have exactly 3 characters
    initials = initials.padEnd(3, 'X').substring(0, 3);

    return initials;
  }

  /**
   * Generate student ID according to the format:
   * ABC-00000-120-12345
   * Where:
   * ABC = school initials
   * 00000 = school code
   * 120 = role code (120 for student)
   * 12345 = sequential person ID
   */
  private async generateStudentId(school: School): Promise<string> {
    // Get school initials
    const schoolInitials = this.getSchoolInitials(school.name);

    const schoolCode = school.schoolCode;

    // Role code for student = 120
    const roleCode = '120';

    // Get sequential person ID (count students in this school + 1)
    const studentCount = await this.studentRepository.count({
      where: {
        school: { id: school.id },
      },
    });

    const personId = (studentCount + 1).toString().padStart(5, '0');

    // Format: ABC-00000-120-12345
    return `${schoolInitials}-${schoolCode}-${roleCode}-${personId}`;
  }

  /**
   * Invite a student - Used by school admin
   */
  async inviteStudent(
    inviteStudentDto: InviteStudentDto,
    adminUser: SchoolAdmin,
  ): Promise<Student> {
    if (adminUser.role.name !== 'school_admin') {
      throw new BadRequestException('Only school admins can invite students');
    }

    if (!adminUser.school) {
      throw new BadRequestException('Admin not associated with any school');
    }

    const existingStudent = await this.studentRepository.findOne({
      where: { email: inviteStudentDto.email },
    });

    if (existingStudent) {
      throw new ConflictException('Student with this email already exists');
    }

    // Get student role
    const studentRole = await this.roleRepository.findOne({
      where: { name: 'student' },
    });

    if (!studentRole) {
      throw new NotFoundException('Student role not found');
    }

    const pin = this.generatePin();
    const studentId = await this.generateStudentId(adminUser.school);

    const invitationExpires = this.calculateTokenExpiration();

    const studentUser = this.studentRepository.create({
      name: inviteStudentDto.name,
      email: inviteStudentDto.email,
      password: await bcrypt.hash(pin, 10), // PIN is used as initial password
      role: studentRole,
      school: adminUser.school,
      status: 'pending',
      invitationToken: uuidv4(),
      invitationExpires,
      isInvitationAccepted: false,
      studentId: studentId,
    });

    const savedStudent = await this.studentRepository.save(studentUser);

    try {
      await this.emailService.sendStudentInvitation(
        savedStudent,
        studentId,
        pin,
      );
      this.logger.log(`Invitation sent to student ${inviteStudentDto.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send invitation to ${inviteStudentDto.email}`,
        error,
      );
    }

    return savedStudent;
  }

  /**
   * Resend invitation to a student - Used by school admin
   */
  async resendStudentInvitation(
    email: string,
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
        email,
        school: { id: adminUser.school.id },
      },
      relations: ['role', 'school'],
    });

    if (!student) {
      throw new NotFoundException('Student not found in your school');
    }

    // Generate new PIN
    const pin = this.generatePin();

    student.invitationToken = uuidv4();
    student.invitationExpires = this.calculateTokenExpiration();
    student.password = await bcrypt.hash(pin, 10);

    const updatedStudent = await this.studentRepository.save(student);

    try {
      await this.emailService.sendStudentInvitation(
        updatedStudent,
        updatedStudent.studentId,
        pin,
      );
      this.logger.log(`Invitation resent to student ${email}`);
    } catch (error) {
      this.logger.error(`Failed to resend invitation to ${email}`, error);
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
    const pin = this.generatePin();
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

  /**
   * Find a student by email or student ID
   */
  async findByEmailOrStudentId(identifier: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: [{ email: identifier }, { studentId: identifier }],
      relations: ['role', 'school'],
    });
  }

  /**
   * Validate student credentials (email/studentId and PIN)
   */
  async validateStudent(
    identifier: string,
    pin: string,
  ): Promise<Student | null> {
    const student = await this.findByEmailOrStudentId(identifier);

    if (!student) {
      return null;
    }

    if (student.status !== 'active') {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pin, student.password);
    if (!isPasswordValid) {
      return null;
    }

    return student;
  }
}
