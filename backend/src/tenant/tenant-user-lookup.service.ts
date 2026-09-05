import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from 'src/school/school.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { Student } from 'src/student/student.entity';
import { Parent } from 'src/parent/parent.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantDirectoryService } from './tenant-directory.service';
import { SchoolProvisioningStatus } from './school-provisioning-status';

/**
 * Pre-login school identity (fail closed).
 *
 * Student/Teacher login and forgot-PIN accept `identifier`:
 * - generated id `INITIALS-SCHOOLCODE-ROLE-PERSON` (school = 5-digit schoolCode), or
 * - email only when tenant_directory has exactly one row for that role.
 *
 * Zero or many directory matches → null. Never scan all tenant schemas.
 * Do not use PIN/password to pick a tenant.
 */
const GENERATED_PIN_ID =
  /^[A-Za-z]{2,4}-(\d{5})-(\d{3})-(\d{5})$/;

@Injectable()
export class TenantUserLookupService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    private readonly directory: TenantDirectoryService,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  async findTeacher(identifier: string): Promise<Teacher | null> {
    return this.findPinUser(identifier, 'teacher', (schoolId, tenantUserId) =>
      this.loadTeacher(schoolId, tenantUserId),
    );
  }

  async findStudent(identifier: string): Promise<Student | null> {
    return this.findPinUser(identifier, 'student', (schoolId, tenantUserId) =>
      this.loadStudent(schoolId, tenantUserId),
    );
  }

  async findParentByEmail(email: string): Promise<Parent | null> {
    const dirs = await this.directory.findByLogin(email, 'parent');
    if (dirs.length !== 1) {
      return null;
    }
    return this.tenantConnection.runForSchoolId(
      dirs[0].schoolId,
      (manager) =>
        manager.findOne(Parent, {
          where: { id: dirs[0].tenantUserId },
          relations: ['role', 'school'],
        }),
    );
  }

  async loadByRefresh(
    userType: string,
    userId: string,
    schoolId: string | null,
  ): Promise<SchoolAdmin | Teacher | Student | Parent | null> {
    if (!schoolId) {
      return null;
    }
    return this.tenantConnection.runForSchoolId(schoolId, async (manager) => {
      let user: SchoolAdmin | Teacher | Student | Parent | null = null;

      if (userType === 'school_admin') {
        user = await manager.findOne(SchoolAdmin, {
          where: { id: userId },
          relations: ['role', 'school'],
        });
      } else if (userType === 'teacher') {
        user = await manager.findOne(Teacher, {
          where: { id: userId },
          relations: ['role', 'school'],
        });
      } else if (userType === 'student') {
        user = await manager.findOne(Student, {
          where: { id: userId },
          relations: ['role', 'school'],
        });
      } else if (userType === 'parent') {
        user = await manager.findOne(Parent, {
          where: { id: userId },
          relations: ['role', 'school'],
        });
      }

      if (!user || !this.isRefreshEligible(userType, user)) {
        return null;
      }
      return user;
    });
  }

  private isRefreshEligible(
    userType: string,
    user: SchoolAdmin | Teacher | Student | Parent,
  ): boolean {
    if (userType === 'school_admin') {
      const admin = user as SchoolAdmin;
      return !admin.isSuspended && !admin.isArchived;
    }
    if (userType === 'teacher') {
      const teacher = user as Teacher;
      return !teacher.isSuspended && !teacher.isArchived;
    }
    if (userType === 'student') {
      const student = user as Student;
      return !student.isArchived;
    }
    if (userType === 'parent') {
      const parent = user as Parent;
      return !parent.isSuspended && !parent.isArchived;
    }
    return false;
  }

  private async findPinUser<T>(
    identifier: string,
    userType: 'student' | 'teacher',
    load: (schoolId: string, tenantUserId: string) => Promise<T | null>,
  ): Promise<T | null> {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return null;
    }

    const dirs = await this.directory.findByLogin(trimmed, userType);
    if (dirs.length === 1) {
      return load(dirs[0].schoolId, dirs[0].tenantUserId);
    }
    if (dirs.length > 1) {
      return null;
    }

    const school = await this.schoolFromGeneratedId(trimmed);
    if (!school) {
      return null;
    }

    return this.tenantConnection.runForSchoolId(school.id, (manager) => {
      if (userType === 'student') {
        return manager
          .getRepository(Student)
          .createQueryBuilder('student')
          .leftJoinAndSelect('student.role', 'role')
          .leftJoinAndSelect('student.school', 'school')
          .where('LOWER(student.studentId) = LOWER(:id)', { id: trimmed })
          .getOne() as Promise<T | null>;
      }
      return manager
        .getRepository(Teacher)
        .createQueryBuilder('teacher')
        .leftJoinAndSelect('teacher.role', 'role')
        .leftJoinAndSelect('teacher.school', 'school')
        .where('LOWER(teacher.teacherId) = LOWER(:id)', { id: trimmed })
        .getOne() as Promise<T | null>;
    });
  }

  private loadTeacher(schoolId: string, id: string): Promise<Teacher | null> {
    return this.tenantConnection.runForSchoolId(schoolId, (manager) =>
      manager.findOne(Teacher, {
        where: { id },
        relations: ['role', 'school'],
      }),
    );
  }

  private loadStudent(schoolId: string, id: string): Promise<Student | null> {
    return this.tenantConnection.runForSchoolId(schoolId, (manager) =>
      manager.findOne(Student, {
        where: { id },
        relations: ['role', 'school'],
      }),
    );
  }

  private async schoolFromGeneratedId(
    identifier: string,
  ): Promise<School | null> {
    const match = GENERATED_PIN_ID.exec(identifier);
    if (!match) {
      return null;
    }
    return this.schoolRepository.findOne({
      where: {
        schoolCode: match[1],
        provisioningStatus: SchoolProvisioningStatus.Active,
        isDisabled: false,
      },
    });
  }
}
