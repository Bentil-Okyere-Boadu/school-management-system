import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Teacher } from '../teacher.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';

type TeacherJwtUser = Partial<Teacher> & { schoolId?: string };

@Injectable()
export class TeacherJwtStrategy extends PassportStrategy(
  Strategy,
  'teacher-jwt',
) {
  constructor(
    private configService: ConfigService,
    private readonly tenantConnection: TenantConnectionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: {
    email: string;
    role: string;
    sub: string;
    schoolId?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<TeacherJwtUser | null> {
    if (payload.role !== 'teacher' || !payload.schoolId) {
      return null;
    }
    return this.tenantConnection.runForSchoolId(
      payload.schoolId,
      async (manager) => {
        const teacher = await manager.findOne(Teacher, {
          where: { id: payload.sub },
          relations: ['role', 'school'],
        });
        if (!teacher || teacher.isSuspended) {
          return null;
        }
        const hasSuspendedAdmin = await manager.findOne(SchoolAdmin, {
          where: { isSuspended: true },
        });
        if (hasSuspendedAdmin) {
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
          schoolId: payload.schoolId,
        };
      },
    );
  }
}
