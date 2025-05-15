import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../common/services/email.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { InviteStudentDto } from './dto/invite-student.dto';
import { InviteTeacherDto } from './dto/invite-teacher.dto';
import { Not } from 'typeorm';
import { InvitationException } from '../common/exceptions/invitation.exception';
import { BaseException } from '../common/exceptions/base.exception';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';
import { Student } from 'src/student/student.entity';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(SchoolAdmin)
    private adminRepository: Repository<SchoolAdmin>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    private emailService: EmailService,
  ) {}

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
   * Generate a random PIN
   */
  private generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
   * Get or generate a proper 5-digit school code
   * If the school already has a code, use it
   * Otherwise, generate a new one based on existing schools count
   */
  private async getSchoolCode(school: School): Promise<string> {
    // If the school already has a valid 5-digit code, use it
    if (school.schoolCode && /^\d{5}$/.test(school.schoolCode)) {
      return school.schoolCode;
    }

    // Generate a new 5-digit code
    const schoolCount = await this.schoolRepository.count();
    const newCode = (schoolCount + 1).toString().padStart(5, '0');

    // Update the school with the new code
    school.schoolCode = newCode;
    await this.schoolRepository.save(school);

    return newCode;
  }

  private async generateStudentId(school: School): Promise<string> {
    // Get school initials
    const schoolInitials = this.getSchoolInitials(school.name);

    // Get or generate school code
    const schoolCode = await this.getSchoolCode(school);

    // Role code for student = 120
    const roleCode = '120';

    // Get sequential person ID (count students in this school + 1)
    const studentCount = await this.studentRepository.count({
      where: {
        school: { id: school.id },
        role: { name: 'student' },
      },
    });

    const personId = (studentCount + 1).toString().padStart(5, '0');

    // Format: ABC-00000-120-12345
    return `${schoolInitials}-${schoolCode}-${roleCode}-${personId}`;
  }

  /**
   * Generate teacher ID according to the format:
   * ABC-00000-123-12345
   * Where:
   * ABC = school initials (first two letters of first word + last initial)
   * 00000 = school code (5-digit unique identifier)
   * 123 = role code (123 for teacher)
   * 12345 = 5-digit person ID
   */
  private async generateTeacherId(school: School): Promise<string> {
    // Get school initials
    const schoolInitials = this.getSchoolInitials(school.name);

    // Get or generate school code
    const schoolCode = await this.getSchoolCode(school);

    // Role code for teacher = 123
    const roleCode = '123';

    // Get sequential person ID (count teachers in this school + 1)
    const teacherCount = await this.userRepository.count({
      where: {
        school: { id: school.id },
        role: { name: 'teacher' },
      },
    });

    const personId = (teacherCount + 1).toString().padStart(5, '0');

    // Format: ABC-00000-123-12345
    return `${schoolInitials}-${schoolCode}-${roleCode}-${personId}`;
  }

  /**
   * Generate admin ID according to the format:
   * ABC-00000-110-12345
   * Where:
   * ABC = school initials (first two letters of first word + last initial)
   * 00000 = school code (5-digit unique identifier)
   * 110 = role code (110 for admin)
   * 12345 = 5-digit person ID
   */
  async generateAdminId(
    school: School,
    existingUser?: SchoolAdmin,
  ): Promise<string> {
    // Get school initials
    const schoolInitials = this.getSchoolInitials(school.name);

    // Get or generate school code
    const schoolCode = await this.getSchoolCode(school);

    // Role code for admin = 110
    const roleCode = '110';

    // Get sequential person ID (count admins in this school + 1)
    const adminCount = await this.adminRepository.count({
      where: {
        school: { id: school.id },
        role: { name: 'school_admin' },
        id: existingUser ? Not(existingUser.id) : undefined,
      },
    });

    const personId = (adminCount + 1).toString().padStart(5, '0');

    // Format: ABC-00000-110-12345
    return `${schoolInitials}-${schoolCode}-${roleCode}-${personId}`;
  }

  /**
   * Invite a user (school admin) - Used by super admin
   */
  async inviteAdmin(
    inviteUserDto: InviteUserDto,
    currentUser: SuperAdmin,
  ): Promise<SchoolAdmin> {
    if (currentUser.role.name !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can invite users');
    }

    const existingAdmin = await this.adminRepository.findOne({
      where: { email: inviteUserDto.email },
    });

    if (existingAdmin) {
      throw new ConflictException('User with this email already exists');
    }

    const role = await this.roleRepository.findOneBy({
      id: inviteUserDto.roleId,
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.name !== 'school_admin') {
      throw new BadRequestException('Super admins can only invite admin users');
    }

    // Create the invitation token and set expiration
    const invitationToken = this.generateInvitationToken();
    const invitationExpires = this.calculateTokenExpiration();

    // Create the user in pending state
    const newAdmin = this.adminRepository.create({
      firstName: inviteUserDto.firstName,
      LastName: inviteUserDto.lastName,
      email: inviteUserDto.email,
      role,
      status: 'pending',
      invitationToken,
      invitationExpires,
    });

    const savedAdmin = await this.adminRepository.save(newAdmin);

    await this.emailService.sendInvitationEmail(savedAdmin);

    return savedAdmin;
  }

  /**
   * Invite a student - Used by school admin
   */
  async inviteStudent(
    inviteStudentDto: InviteStudentDto,
    adminUser: SchoolAdmin,
  ): Promise<User> {
    console.log('Admin User:', adminUser);
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException('Only school admins can invite students');
    }

    if (!adminUser.school) {
      throw new UnauthorizedException('Admin not associated with any school');
    }

    const existingUser = await this.studentRepository.findOne({
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
    const studentId = await this.generateStudentId(adminUser.school);

    const invitationExpires = new Date();
    invitationExpires.setHours(invitationExpires.getHours() + 24);

    const studentUser = this.studentRepository.create({
      name: inviteStudentDto.name,
      email: inviteStudentDto.email,
      password: await bcrypt.hash(pin, 10), // PIN is used as initial password
      role: studentRole,
      school: adminUser.school,
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

  /**
   * Invite a teacher - Used by school admin
   */
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
    const teacherId = await this.generateTeacherId(adminUser.school);

    const invitationExpires = new Date();
    invitationExpires.setHours(invitationExpires.getHours() + 24);

    const teacherUser = this.userRepository.create({
      name: inviteTeacherDto.name,
      email: inviteTeacherDto.email,
      password: await bcrypt.hash(pin, 10),
      role: teacherRole,
      school: adminUser.school,
      status: 'pending',
      invitationToken: uuidv4(),
      invitationExpires,
      isInvitationAccepted: false,
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

  async verifyInvitationToken(token: string) {
    const user = await this.adminRepository.findOne({
      where: { invitationToken: token, status: 'pending' },
      relations: ['role', 'school'],
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid invitation token - token not found',
      );
    }

    const expiryTimestamp = user.invitationExpires.getTime();
    const currentTimestamp = Date.now();

    if (expiryTimestamp <= currentTimestamp) {
      throw new BadRequestException(
        'Invitation token has expired - please request a new invitation',
      );
    }

    return user;
  }

  async completeRegistration(token: string, password: string) {
    const adminuser = await this.verifyInvitationToken(token);
    const hashPassword = await bcrypt.hash(password, 10);

    adminuser.password = hashPassword;
    adminuser.status = 'active';
    adminuser.isInvitationAccepted = true;
    adminuser.invitationToken = '';
    adminuser.invitationExpires = new Date(0);

    const savedAdmin = await this.adminRepository.save(adminuser);

    await this.emailService.sendRegistrationConfirmationEmail(adminuser);

    return savedAdmin;
  }

  async resendAdminInvitation(
    userId: string,
    currentUser: SuperAdmin,
  ): Promise<SchoolAdmin> {
    if (currentUser.role.name !== 'super_admin') {
      throw new UnauthorizedException(
        'Only super admins can resend invitations',
      );
    }

    const admin = await this.adminRepository.findOne({
      where: { id: userId, status: 'pending' },
      relations: ['role', 'school'],
    });

    if (!admin) {
      throw new NotFoundException('Pending user not found');
    }

    admin.invitationToken = this.generateInvitationToken();
    admin.invitationExpires = this.calculateTokenExpiration();

    const updatedAdmin = await this.adminRepository.save(admin);

    await this.emailService.sendInvitationEmail(updatedAdmin);

    return updatedAdmin;
  }

  /**
   * Resend invitation to a teacher - Used by school admin
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

    // Update token and expiration date
    teacher.invitationToken = uuidv4();
    teacher.invitationExpires = this.calculateTokenExpiration();
    teacher.password = await bcrypt.hash(pin, 10);

    const updatedTeacher = await this.userRepository.save(teacher);

    try {
      // Send new invitation
      await this.emailService.sendTeacherInvitation(
        updatedTeacher,
        updatedTeacher.teacherId,
        pin,
      );
      this.logger.log(`Invitation resent to teacher ${email}`);
    } catch (error) {
      this.logger.error(`Failed to resend invitation to ${email}`, error);
      throw new InvitationException(
        `Failed to resend invitation: ${BaseException.getErrorMessage(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return updatedTeacher;
  }

  /**
   * Handle forgot PIN for students/teachers
   */
  async forgotPin(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return {
        success: true,
        message: 'If your email is registered, you will receive a PIN reset',
      };
    }

    // Only for students and teachers
    if (user.role.name !== 'student' && user.role.name !== 'teacher') {
      throw new BadRequestException(
        'PIN reset is only available for students and teachers',
      );
    }

    // Generate new PIN
    const pin = this.generatePin();
    user.password = await bcrypt.hash(pin, 10);

    await this.userRepository.save(user);

    try {
      // Different email based on role
      if (user.role.name === 'student') {
        await this.emailService.sendStudentPinReset(user, pin);
      } else {
        await this.emailService.sendTeacherPinReset(user, pin);
      }

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
