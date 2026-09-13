import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SchoolAdmin } from '../school-admin.entity';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';

@Injectable()
export class SchoolAdminJwtStrategy extends PassportStrategy(
  Strategy,
  'school-admin-jwt',
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
    role?: string;
    sub?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    schoolId?: string;
  }) {
    if (
      payload.role !== 'school_admin' ||
      !payload.schoolId ||
      !payload.sub
    ) {
      return null;
    }

    return this.tenantConnection.runForSchoolId(
      payload.schoolId,
      async (manager) => {
        const schoolAdmin = await manager.findOne(SchoolAdmin, {
          where: { id: payload.sub },
          relations: ['role', 'school'],
        });
        if (
          !schoolAdmin ||
          schoolAdmin.isSuspended ||
          schoolAdmin.isArchived
        ) {
          return null;
        }
        return {
          id: schoolAdmin.id,
          email: schoolAdmin.email,
          firstName: schoolAdmin.firstName,
          lastName: schoolAdmin.lastName,
          status: schoolAdmin.status,
          role: schoolAdmin.role,
          school: schoolAdmin.school,
          schoolId: payload.schoolId,
        };
      },
    );
  }
}
