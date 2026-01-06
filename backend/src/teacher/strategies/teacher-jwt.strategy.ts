import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TeacherAuthService } from '../teacher.auth.service';
import { Teacher } from '../teacher.entity';

interface JwtPayload {
  email: string;
  role: string;
  sub: string;
}

@Injectable()
export class TeacherJwtStrategy extends PassportStrategy(
  Strategy,
  'teacher-jwt',
) {
  constructor(
    private configService: ConfigService,
    private teacherAuthService: TeacherAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<Partial<Teacher> | null> {
    if (payload.role !== 'teacher') {
      return null;
    }
    const teacher = await this.teacherAuthService.findByEmailOrTeacherId(payload.email);
    if (!teacher || teacher.isSuspended) {
      return null;
    }
    return {
      id: teacher.id,
      email: teacher.email,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      status: teacher.status,
      role: teacher.role,
      teacherId: teacher.teacherId,
      school: teacher.school,
    };
  }
} 