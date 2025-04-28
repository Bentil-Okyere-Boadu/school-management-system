import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Role } from 'src/role/role.entity';
import { School } from 'src/school/school.entity';
import { InviteStudentDto } from '../dto/invite-student.dto';
import { InviteTeacherDto } from '../dto/invite-teacher.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from 'src/common/services/email.service';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private emailService: EmailService,
  ) {}

  private generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateStudentId(
    format: 'long' | 'short',
    school: School,
  ): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearShort = currentYear.toString().substring(2);

    const studentCount = await this.userRepository.count({
      where: {
        school: { id: school.id },
        role: { name: 'student' },
      },
    });

    const sequenceNumber = studentCount + 1;

    if (format === 'long') {
      // Format: STD20250001 (prefix + year + sequential number padded to 4 digits)
      return `STD${currentYear}${sequenceNumber.toString().padStart(4, '0')}`;
    } else {
      // Format: S250001 (prefix + year short + sequential number padded to 4 digits)
      return `S${yearShort}${sequenceNumber.toString().padStart(4, '0')}`;
    }
  }

  private async generateTeacherId(
    format: 'long' | 'short',
    school: School,
  ): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearShort = currentYear.toString().substring(2);

    const teacherCount = await this.userRepository.count({
      where: {
        school: { id: school.id },
        role: { name: 'teacher' },
      },
    });

    const sequenceNumber = teacherCount + 1;

    if (format === 'long') {
      // Format: TCH2025001 (prefix + year + sequential number padded to 3 digits)
      return `TCH${currentYear}${sequenceNumber.toString().padStart(3, '0')}`;
    } else {
      // Format: TEA25001 (prefix + year short + sequential number padded to 3 digits)
      return `TEA${yearShort}${sequenceNumber.toString().padStart(3, '0')}`;
    }
  }

  async inviteStudent(
    inviteStudentDto: InviteStudentDto,
    adminUser: User,
  ): Promise<User> {
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException('Only school admins can invite students');
    }

    if (!adminUser.school) {
      throw new UnauthorizedException('Admin not associated with any school');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: inviteStudentDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Get student role
    const studentRole = await this.roleRepository.findOne({
      where: { name: 'student' },
    });

    if (!studentRole) {
      throw new NotFoundException('Student role not found');
    }

    const pin = this.generatePin();
    const studentId = await this.generateStudentId(
      inviteStudentDto.idFormat || 'long',
      adminUser.school,
    );

    const invitationExpires = new Date();
    invitationExpires.setHours(invitationExpires.getHours() + 1);

    const studentUser = this.userRepository.create({
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

    const savedUser = await this.userRepository.save(studentUser);

    try {
      await this.emailService.sendStudentInvitation(savedUser, studentId, pin);
      this.logger.log(`Invitation sent to student ${inviteStudentDto.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send invitation to ${inviteStudentDto.email}`,
        error,
      );
    }

    return savedUser;
  }

  async inviteTeacher(
    inviteTeacherDto: InviteTeacherDto,
    adminUser: User,
  ): Promise<User> {
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException('Only school admins can invite teachers');
    }

    if (!adminUser.school) {
      throw new UnauthorizedException('Admin not associated with any school');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: inviteTeacherDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const teacherRole = await this.roleRepository.findOne({
      where: { name: 'teacher' },
    });

    if (!teacherRole) {
      throw new NotFoundException('Teacher role not found');
    }

    const pin = this.generatePin();
    const teacherId = await this.generateTeacherId(
      inviteTeacherDto.idFormat || 'long',
      adminUser.school,
    );

    // Generate expiry for invitation token (24 hours)
    const invitationExpires = new Date();
    invitationExpires.setHours(invitationExpires.getHours() + 1);

    // Create the teacher user
    const teacherUser = this.userRepository.create({
      name: inviteTeacherDto.name,
      email: inviteTeacherDto.email,
      password: await bcrypt.hash(pin, 10), // PIN is used as initial password
      role: teacherRole,
      school: adminUser.school,
      status: 'pending',
      invitationToken: uuidv4(),
      invitationExpires,
      isInvitationAccepted: false,
      // Custom fields for teacher ID
      teacherId: teacherId,
    });

    const savedUser = await this.userRepository.save(teacherUser);

    try {
      await this.emailService.sendTeacherInvitation(savedUser, teacherId, pin);
      this.logger.log(`Invitation sent to teacher ${inviteTeacherDto.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send invitation to ${inviteTeacherDto.email}`,
        error,
      );
    }

    return savedUser;
  }
  // Add these methods to backend/src/auth/service/invitation.service.ts

  /**
   * Resend invitation to a student
   * @param email Student's email
   * @param adminUser Current admin user
   * @returns Updated user object
   */
  async resendStudentInvitation(email: string, adminUser: User): Promise<User> {
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException(
        'Only school admins can resend invitations',
      );
    }

    if (!adminUser.school) {
      throw new UnauthorizedException('Admin not associated with any school');
    }

    // Find the student user
    const student = await this.userRepository.findOne({
      where: {
        email,
        role: { name: 'student' },
        school: { id: adminUser.school.id },
      },
      relations: ['role', 'school'],
    });

    if (!student) {
      throw new NotFoundException('Student not found in your school');
    }

    const pin = this.generatePin();

    student.password = await bcrypt.hash(pin, 10);
    student.invitationToken = uuidv4();
    student.invitationExpires = new Date(Date.now() + 3600000); // 1 hour from now
    student.isInvitationAccepted = false;

    if (student.status === 'active') {
      student.status = 'pending';
    }

    const updatedStudent = await this.userRepository.save(student);

    try {
      await this.emailService.sendStudentInvitation(
        updatedStudent,
        student.studentId,
        pin,
      );
      this.logger.log(`Invitation resent to student ${email}`);
    } catch (error) {
      this.logger.error(`Failed to resend invitation to ${email}`, error);
    }

    return updatedStudent;
  }

  /**
   * Resend invitation to a teacher
   * @param email Teacher's email
   * @param adminUser Current admin user
   * @returns Updated user object
   */
  async resendTeacherInvitation(email: string, adminUser: User): Promise<User> {
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException(
        'Only school admins can resend invitations',
      );
    }

    if (!adminUser.school) {
      throw new UnauthorizedException('Admin not associated with any school');
    }

    // Find the teacher user
    const teacher = await this.userRepository.findOne({
      where: {
        email,
        role: { name: 'teacher' },
        school: { id: adminUser.school.id },
      },
      relations: ['role', 'school'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found in your school');
    }

    // Generate new PIN
    const pin = this.generatePin();

    // Update teacher record
    teacher.password = await bcrypt.hash(pin, 10);
    teacher.invitationToken = uuidv4();
    teacher.invitationExpires = new Date(Date.now() + 3600000); // 1 hour from now
    teacher.isInvitationAccepted = false;

    if (teacher.status === 'active') {
      teacher.status = 'pending';
    }

    const updatedTeacher = await this.userRepository.save(teacher);

    // Send email with new credentials
    try {
      await this.emailService.sendTeacherInvitation(
        updatedTeacher,
        teacher.teacherId,
        pin,
      );
      this.logger.log(`Invitation resent to teacher ${email}`);
    } catch (error) {
      this.logger.error(`Failed to resend invitation to ${email}`, error);
      // Continue as the user is updated but email failed
    }

    return updatedTeacher;
  }

  /**
   * Handle forgot PIN for students and teachers
   * @param email User's email
   * @returns Success message
   */
  async forgotPin(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    // Always return a generic success message for security
    const successResponse = {
      success: true,
      message:
        'If your email exists in our system, you will receive your new PIN',
    };

    // Find user (either student or teacher)
    const user = await this.userRepository.findOne({
      where: [
        { email, role: { name: 'student' } },
        { email, role: { name: 'teacher' } },
      ],
      relations: ['role', 'school'],
    });

    if (!user) {
      return successResponse;
    }

    const pin = this.generatePin();

    user.password = await bcrypt.hash(pin, 10);
    await this.userRepository.save(user);

    try {
      if (user.role.name === 'student') {
        await this.emailService.sendStudentInvitation(
          user,
          user.studentId,
          pin,
        );
        this.logger.log(`PIN reset email sent to student ${email}`);
      } else if (user.role.name === 'teacher') {
        await this.emailService.sendTeacherInvitation(
          user,
          user.teacherId,
          pin,
        );
        this.logger.log(`PIN reset email sent to teacher ${email}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send PIN reset email to ${email}`, error);
      // Still return success message for security
    }

    return successResponse;
  }
}
