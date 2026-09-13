import { AuthService } from 'src/auth/auth.service';
import { Injectable } from '@nestjs/common';
import { Student } from './student.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import * as bcrypt from 'bcryptjs';
import { TenantUserLookupService } from 'src/tenant/tenant-user-lookup.service';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';

@Injectable()
export class StudentAuthService {
  constructor(
    private readonly tenantUserLookup: TenantUserLookupService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly authService: AuthService,
  ) {}

  async validateStudent(
    identifier: string,
    pin: string,
  ): Promise<Student | null> {
    const student = await this.findByEmailOrStudentId(identifier);

    if (!student) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pin, student.password);
    if (!isPasswordValid) {
      return null;
    }

    if (student.school?.id) {
      const hasSuspendedAdmin = await this.tenantConnection.runForSchoolId(
        student.school.id,
        (manager) =>
          manager.findOne(SchoolAdmin, { where: { isSuspended: true } }),
      );
      if (hasSuspendedAdmin) {
        return null;
      }
    }

    if (student.status === 'pending') {
      student.status = 'active';
      student.isInvitationAccepted = true;
      await this.tenantConnection.runForSchoolId(
        student.school.id,
        (manager) => manager.save(Student, student),
      );
    }

    return student;
  }

  async findByEmailOrStudentId(identifier: string): Promise<Student | null> {
    return this.tenantUserLookup.findStudent(identifier);
  }

  login(student: Student) {
    return this.authService.createAuthResponse(student);
  }
}
