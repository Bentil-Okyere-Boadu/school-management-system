import { Injectable } from '@nestjs/common';
import { Teacher } from './teacher.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { AuthService } from 'src/auth/auth.service';
import * as bcrypt from 'bcryptjs';
import { TenantUserLookupService } from 'src/tenant/tenant-user-lookup.service';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';

@Injectable()
export class TeacherAuthService {
  constructor(
    private readonly tenantUserLookup: TenantUserLookupService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly authService: AuthService,
  ) {}

  async validateTeacher(
    identifier: string,
    pin: string,
  ): Promise<Teacher | null> {
    const teacher = await this.findByEmailOrTeacherId(identifier);
    if (!teacher) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pin, teacher.password);
    if (!isPasswordValid || teacher.isSuspended) {
      return null;
    }

    if (teacher.school?.id) {
      const hasSuspendedAdmin = await this.tenantConnection.runForSchoolId(
        teacher.school.id,
        (manager) =>
          manager.findOne(SchoolAdmin, { where: { isSuspended: true } }),
      );
      if (hasSuspendedAdmin) {
        return null;
      }
    }

    if (teacher.status === 'pending') {
      teacher.status = 'active';
      teacher.isInvitationAccepted = true;
      await this.tenantConnection.runForSchoolId(
        teacher.school.id,
        (manager) => manager.save(Teacher, teacher),
      );
    }

    return teacher;
  }

  async findByEmailOrTeacherId(identifier: string): Promise<Teacher | null> {
    return this.tenantUserLookup.findTeacher(identifier);
  }

  login(teacher: Teacher) {
    return this.authService.createAuthResponse(teacher);
  }
}
