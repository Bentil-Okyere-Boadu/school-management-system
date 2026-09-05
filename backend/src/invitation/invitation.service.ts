import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';
import * as bcrypt from 'bcryptjs';
import { EmailRetryService } from '../common/services/email-retry.service';
import { InviteStudentDto } from './dto/invite-student.dto';
import { InviteTeacherDto } from './dto/invite-teacher.dto';
import { Not } from 'typeorm';
import { InvitationException } from '../common/exceptions/invitation.exception';
import { BaseException } from '../common/exceptions/base.exception';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Student } from 'src/student/student.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { TenantDirectoryService } from 'src/tenant/tenant-directory.service';
import { TransactionUtil } from '../common/utils/transaction.util';
import { randomInt } from 'crypto';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(SchoolAdmin)
    private adminRepository: Repository<SchoolAdmin>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    private emailRetryService: EmailRetryService,
    private transactionUtil: TransactionUtil,
    private readonly tenantDirectory: TenantDirectoryService,
  ) {}

  /**
   * Generate a random PIN
   */
  generatePin(): string {
    return String(randomInt(100000, 1_000_000));
  }

  /**
   * Extract school initials from name
   * Gets first letter of each word, up to 3 letters
   * If the school name has fewer than 3 words, it uses the second letter of the first word
   */
  getSchoolInitials(schoolName: string): string {
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

    let next = (await this.schoolRepository.count()) + 1;
    for (let attempt = 0; attempt < 10000; attempt += 1) {
      const newCode = next.toString().padStart(5, '0');
      const taken = await this.schoolRepository.findOne({
        where: { schoolCode: newCode },
      });
      if (!taken) {
        school.schoolCode = newCode;
        await this.schoolRepository.save(school);
        return newCode;
      }
      next += 1;
    }
    throw new ConflictException('Unable to allocate a unique school code');
  }

  async generateStudentId(school: School): Promise<string> {
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
    const teacherCount = await this.teacherRepository.count({
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

  async generateUniqueStudentBillingCode(
    manager: EntityManager,
  ): Promise<string> {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const code = `SBC${String(randomInt(0, 1_000_000)).padStart(6, '0')}`;
      const inTenant = await manager.findOne(Student, {
        where: { studentBillingCode: code },
        select: ['id'],
      });
      if (inTenant) {
        continue;
      }
      const dirs = await this.tenantDirectory.findByLogin(code, 'student');
      if (dirs.length > 0) {
        continue;
      }
      return code;
    }
    throw new InvitationException(
      'Failed to allocate a unique student billing code',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Invite a student - Used by school admin
   */
  async inviteStudent(
    inviteStudentDto: InviteStudentDto,
    adminUser: SchoolAdmin,
  ): Promise<Student> {
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException('Only school admins can invite students');
    }

    if (!adminUser.school) {
      throw new ForbiddenException('Admin not associated with any school');
    }
    const school = await this.schoolRepository.findOne({
      where: { id: adminUser.school.id },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const savedStudent = await this.transactionUtil.executeInTransaction(
      async (manager: EntityManager) => {
        const existingUser = await manager.findOne(Student, {
          where: { email: inviteStudentDto.email },
        });

        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }

        // Get student role
        const studentRole = await manager.findOne(Role, {
          where: { name: 'student' },
        });

        if (!studentRole) {
          throw new NotFoundException('Student role not found');
        }

        const pin = this.generatePin();
        const studentId = await this.generateStudentId(school);

        const billingCode = await this.generateUniqueStudentBillingCode(manager);
        const studentUser = manager.create(Student, {
          firstName: inviteStudentDto.firstName,
          lastName: inviteStudentDto.lastName,
          email: inviteStudentDto.email,
          password: await bcrypt.hash(pin, 10), // PIN is used as initial password
          role: studentRole,
          school,
          isInvitationAccepted: false,
          studentId: studentId,
          studentBillingCode: billingCode,
        });

        const savedUser = await manager.save(Student, studentUser);

        try {
          // Use EmailRetryService to retry transient email failures
          // Note: Retries happen inside transaction to maintain atomicity.
          await this.emailRetryService.retrySendStudentInvitation(
            savedUser,
            studentId,
            pin,
          );
          this.logger.log(
            `Invitation sent to student ${inviteStudentDto.email}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send invitation to ${inviteStudentDto.email} after retries`,
            error,
          );
          // The transaction will be rolled back automatically due to the error
          throw new InvitationException(
            `Failed to send student invitation email: ${BaseException.getErrorMessage(error)}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        return savedUser;
      },
    );
    await this.tenantDirectory.upsertStudentLookupKeys({
      schoolId: adminUser.school.id,
      tenantUserId: savedStudent.id,
      email: savedStudent.email,
      studentId: savedStudent.studentId,
      billingCode: savedStudent.studentBillingCode,
    });
    return savedStudent;
  }
  async inviteTeacher(
    inviteTeacherDto: InviteTeacherDto,
    adminUser: SchoolAdmin,
  ): Promise<Teacher> {
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException('Only school admins can invite teachers');
    }

    if (!adminUser.school) {
      throw new UnauthorizedException('Admin not associated with any school');
    }
    const school = await this.schoolRepository.findOne({
      where: { id: adminUser.school.id },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const savedTeacher = await this.transactionUtil.executeInTransaction(
      async (manager: EntityManager) => {
        const existingUser = await manager.findOne(Teacher, {
          where: { email: inviteTeacherDto.email },
        });

        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }

        const teacherRole = await manager.findOne(Role, {
          where: { name: 'teacher' },
        });

        if (!teacherRole) {
          throw new NotFoundException('Teacher role not found');
        }

        const pin = this.generatePin();
        const teacherId = await this.generateTeacherId(school);

        const teacherUser = manager.create(Teacher, {
          firstName: inviteTeacherDto.firstName,
          lastName: inviteTeacherDto.lastName,
          email: inviteTeacherDto.email,
          password: await bcrypt.hash(pin, 10),
          role: teacherRole,
          school,
          status: 'pending',
          isInvitationAccepted: false,
          teacherId: teacherId,
        });

        const savedUser = await manager.save(Teacher, teacherUser);

        try {
          // Use EmailRetryService to retry transient email failures
          // Note: Retries happen inside transaction to maintain atomicity.
          await this.emailRetryService.retrySendTeacherInvitation(
            savedUser,
            teacherId,
            pin,
          );
          this.logger.log(
            `Invitation sent to teacher ${inviteTeacherDto.email}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send invitation to ${inviteTeacherDto.email} after retries`,
            error,
          );
          // The transaction will be rolled back automatically due to the error
          throw new InvitationException(
            `Failed to send teacher invitation email: ${BaseException.getErrorMessage(error)}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        return savedUser;
      },
    );
    await this.tenantDirectory.upsert({
      loginKey: savedTeacher.email,
      userType: 'teacher',
      schoolId: adminUser.school.id,
      tenantUserId: savedTeacher.id,
    });
    if (savedTeacher.teacherId) {
      await this.tenantDirectory.upsert({
        loginKey: savedTeacher.teacherId,
        userType: 'teacher',
        schoolId: adminUser.school.id,
        tenantUserId: savedTeacher.id,
      });
    }
    return savedTeacher;
  }
}
