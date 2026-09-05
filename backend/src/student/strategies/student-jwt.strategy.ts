import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { Student } from '../student.entity';

@Injectable()
export class StudentJwtStrategy extends PassportStrategy(
  Strategy,
  'student-jwt',
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
    schoolId?: string;
    firstName?: string;
    lastName?: string;
  }) {
    if (payload.role !== 'student' || !payload.schoolId || !payload.sub) {
      return null;
    }
    return this.tenantConnection.runForSchoolId(
      payload.schoolId,
      async (manager) => {
        const student = await manager.findOne(Student, {
          where: { id: payload.sub },
          relations: ['role', 'school'],
        });
        if (!student) {
          return null;
        }
        const hasSuspendedAdmin = await manager.findOne(SchoolAdmin, {
          where: { isSuspended: true },
        });
        if (hasSuspendedAdmin) {
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
          schoolId: payload.schoolId,
        };
      },
    );
  }
}
