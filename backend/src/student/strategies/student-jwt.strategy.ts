import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { StudentAuthService } from '../student.auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';

@Injectable()
export class StudentJwtStrategy extends PassportStrategy(
  Strategy,
  'student-jwt',
) {
  constructor(
    private configService: ConfigService,
    private studentAuthService: StudentAuthService,
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: any) {
    if (payload.role !== 'student') {
      return null;
    }
    const student = await this.studentAuthService.findByEmailOrStudentId(
      payload.email,
    );
    if (!student) {
      return null;
    }

    // Check if any school admin for this school is suspended
    // If yes, logout all students and teachers of that school
    if (student.school?.id) {
      const hasSuspendedAdmin = await this.schoolAdminRepository.findOne({
        where: { school: { id: student.school.id }, isSuspended: true },
      });
      if (hasSuspendedAdmin) {
        return null; // Logout student
      }
    }

    return {
      id: student.id,
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      status: student.status,
      role: student.role,
      studentId: student.studentId,
      school: student.school,
    };
  }
}
