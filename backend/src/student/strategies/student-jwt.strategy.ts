import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { StudentAuthService } from '../student.auth.service';

@Injectable()
export class StudentJwtStrategy extends PassportStrategy(
  Strategy,
  'student-jwt',
) {
  constructor(
    private configService: ConfigService,
    private studentAuthService: StudentAuthService,
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
