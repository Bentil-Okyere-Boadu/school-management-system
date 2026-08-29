import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SchoolAdminJwtStrategy extends PassportStrategy(
  Strategy,
  'school-admin-jwt',
) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: {
    role?: string;
    sub?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    schoolId?: string;
  }) {
    if (payload.role !== 'school_admin' || !payload.schoolId) {
      return null;
    }
    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      status: 'active',
      role: { name: payload.role },
      school: { id: payload.schoolId },
      schoolId: payload.schoolId,
    };
  }
}
