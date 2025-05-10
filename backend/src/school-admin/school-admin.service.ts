import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { SchoolAdmin } from './school-admin.entity';
import { APIFeatures, QueryString } from '../common/api-features/api-features';
import { Student } from '../student/student.entity';
import { User } from '../user/user.entity';

@Injectable()
export class SchoolAdminAuthService {
  private readonly logger = new Logger(SchoolAdminAuthService.name);

  constructor(
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
    private jwtService: JwtService,
  ) {}

  async validateSchoolAdmin(email: string, pin: string): Promise<SchoolAdmin> {
    const schoolAdmin = await this.schoolAdminRepository.findOne({
      where: { email },
    });

    if (!schoolAdmin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPinValid = await bcrypt.compare(pin, schoolAdmin.password);

    if (!isPinValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (schoolAdmin.status === 'pending') {
      schoolAdmin.status = 'active';
      schoolAdmin.isInvitationAccepted = true;
      await this.schoolAdminRepository.save(schoolAdmin);
      this.logger.log(
        `School Admin ${schoolAdmin.name} activated their account on first login`,
      );
    }

    return schoolAdmin;
  }

  createAuthResponse(schoolAdmin: SchoolAdmin) {
    const payload = {
      email: schoolAdmin.email,
      sub: schoolAdmin.id,
      role: schoolAdmin.role?.name,
      schoolId: schoolAdmin.school?.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      ...schoolAdmin,
    };
  }

  async login(email: string, pin: string) {
    const schoolAdmin = await this.validateSchoolAdmin(email, pin);
    return this.createAuthResponse(schoolAdmin);
  }

  // async forgotPin(email: string) {
  //   const successResponse = {
  //     success: true,
  //     message:
  //       'If your details are in our system, you will receive a PIN reset link',
  //   };

  //   const schoolAdmin = await this.schoolAdminRepository.findOne({
  //     where: { email },
  //   });

  //   if (!schoolAdmin) {
  //     // Return success anyway to prevent email enumeration
  //     return successResponse;
  //   }

  //   const resetToken = uuidv4();
  //   const resetTokenExpires = new Date();
  //   resetTokenExpires.setMinutes(resetTokenExpires.getMinutes() + 30);

  //   schoolAdmin.resetPinToken = resetToken;
  //   schoolAdmin.resetPinExpires = resetTokenExpires;
  //   await this.schoolAdminRepository.save(schoolAdmin);

  //   // Send reset email with token
  //   await this.emailService.sendPinResetEmail(
  //     schoolAdmin.email,
  //     schoolAdmin.name,
  //     resetToken,
  //   );

  //   return successResponse;
  // }

  // async resetPin(token: string, newPin: string) {
  //   const now = new Date();
  //   const schoolAdmin = await this.schoolAdminRepository.findOne({
  //     where: {
  //       resetPasswordToken: token,
  //       resetPasswordExpires: { $gt: now }, // Expiry date must be in the future
  //     },
  //   });

  //   if (!schoolAdmin) {
  //     throw new NotFoundException('Invalid or expired reset token');
  //   }

  //   // Hash and update the PIN
  //   const hashedPin = await bcrypt.hash(newPin, 10);
  //   schoolAdmin.password = hashedPin;
  //   schoolAdmin.resetPasswordToken = null;
  //   schoolAdmin.resetPasswordExpires = null;
  //   await this.schoolAdminRepository.save(schoolAdmin);

  //   return {
  //     success: true,
  //     message: 'PIN has been reset successfully',
  //   };
  // }
}

@Injectable()
export class SchoolAdminService {
  private readonly logger = new Logger(SchoolAdminService.name);

  constructor(
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
      .where('student.school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived: false });

    const featuresWithoutPagination = new APIFeatures(
      baseQuery.clone(),
      queryString,
    )
      .filter()
      .sort()
      .search()
      .limitFields();

    const total = await featuresWithoutPagination.getQuery().getCount();

    const featuresWithPagination = featuresWithoutPagination.paginate();
    const data = await featuresWithPagination.getQuery().getMany();

    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findAllTeachers(schoolId: string, queryString: QueryString) {
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.school', 'school')
      .where('user.school.id = :schoolId', { schoolId })
      .andWhere('role.name = :roleName', { roleName: 'teacher' })
      .andWhere('user.status != :status', { status: 'archived' });

    const featuresWithoutPagination = new APIFeatures(
      baseQuery.clone(),
      queryString,
    )
      .filter()
      .sort()
      .search()
      .limitFields();

    const total = await featuresWithoutPagination.getQuery().getCount();

    const featuresWithPagination = featuresWithoutPagination.paginate();
    const data = await featuresWithPagination.getQuery().getMany();

    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findAllUsers(schoolId: string, queryString: QueryString) {
    // Get students
    const studentsQuery = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.role', 'role')
      .leftJoinAndSelect('student.school', 'school')
      .where('student.school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived: false });

    const studentsFeatures = new APIFeatures(studentsQuery, queryString)
      .filter()
      .sort()
      .search()
      .limitFields()
      .paginate();

    const students = await studentsFeatures.getQuery().getMany();

    // Get teachers
    const teachersQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.school', 'school')
      .where('user.school.id = :schoolId', { schoolId })
      .andWhere('role.name = :roleName', { roleName: 'teacher' })
      .andWhere('user.status != :status', { status: 'archived' });

    const teachersFeatures = new APIFeatures(teachersQuery, queryString)
      .filter()
      .sort()
      .search()
      .limitFields()
      .paginate();

    const teachers = await teachersFeatures.getQuery().getMany();

    // Count total records for pagination
    const studentsCount = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.school', 'school')
      .where('student.school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived: false })
      .getCount();

    const teachersCount = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.school', 'school')
      .where('user.school.id = :schoolId', { schoolId })
      .andWhere('role.name = :roleName', { roleName: 'teacher' })
      .andWhere('user.status != :status', { status: 'archived' })
      .getCount();

    // Add userType to each entity
    const studentsWithType = students.map((student) => ({
      ...student,
      userType: 'student',
    }));

    const teachersWithType = teachers.map((teacher) => ({
      ...teacher,
      userType: 'teacher',
    }));

    // Combine data
    const combinedData = [...studentsWithType, ...teachersWithType];

    // Pagination metadata
    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const total = studentsCount + teachersCount;
    const totalPages = Math.ceil(total / limit);

    return {
      data: combinedData,
      meta: {
        total,
        page,
        limit,
        totalPages,
        studentsCount,
        teachersCount,
      },
    };
  }
}
