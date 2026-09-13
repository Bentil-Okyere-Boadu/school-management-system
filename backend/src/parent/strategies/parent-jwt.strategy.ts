import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Parent } from '../parent.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';

@Injectable()
export class ParentJwtStrategy extends PassportStrategy(Strategy, 'parent-jwt') {
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
    schoolId?: string;
  }) {
    if (payload.role !== 'parent' || !payload.schoolId || !payload.sub) {
      return null;
    }

    return this.tenantConnection.runForSchoolId(
      payload.schoolId,
      async (manager) => {
        const parent = await manager.findOne(Parent, {
          where: { id: payload.sub },
          relations: ['role', 'school'],
        });
        if (!parent || parent.isSuspended || parent.isArchived) {
          return null;
        }
        const hasSuspendedAdmin = await manager.findOne(SchoolAdmin, {
          where: { isSuspended: true },
        });
        if (hasSuspendedAdmin) {
          return null;
        }
        return {
          id: parent.id,
          email: parent.email,
          firstName: parent.firstName,
          lastName: parent.lastName,
          status: parent.status,
          role: parent.role,
          school: parent.school,
          schoolId: payload.schoolId,
        };
      },
    );
  }
}
