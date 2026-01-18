import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Student } from '../student.entity';
import { StudentAuthService } from '../student.auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';

@Injectable()
export class StudentLocalStrategy extends PassportStrategy(
  Strategy,
  'student-local',
) {
  constructor(
    private readonly studentAuthService: StudentAuthService,
    @InjectRepository(SchoolAdmin)
    private readonly schoolAdminRepository: Repository<SchoolAdmin>,
  ) {
    // By default, passport-local expects 'username' and 'password'.
    // We'll use 'identifier' (studentId or email) and 'pin'.
    super({ usernameField: 'identifier', passwordField: 'pin' });
  }

  async validate(identifier: string, pin: string): Promise<Student> {
    const student = await this.studentAuthService.validateStudent(
      identifier,
      pin,
    );
    if (!student) {
      // Check if the student exists and their school admin is suspended
      const foundStudent = await this.studentAuthService.findByEmailOrStudentId(identifier);
      if (foundStudent?.school?.id) {
        const hasSuspendedAdmin = await this.schoolAdminRepository.findOne({
          where: { school: { id: foundStudent.school.id }, isSuspended: true },
        });
        if (hasSuspendedAdmin) {
          throw new UnauthorizedException(
            'Access denied. This account cannot be accessed at the moment. Please contact your school for further assistance.',
          );
        }
      }
      throw new UnauthorizedException('Invalid credentials');
    }
    return student;
  }
}
