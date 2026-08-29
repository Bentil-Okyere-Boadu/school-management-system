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
import { TenantIterationService } from './tenant-iteration.service';
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
    private readonly iteration: TenantIterationService,
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

  async findParentsByEmail(email: string): Promise<Parent[]> {
    const dirs = await this.directory.findByLogin(email, 'parent');
    const parents: Parent[] = [];
    if (dirs.length > 0) {
      for (const dir of dirs) {
        const parent = await this.tenantConnection.runForSchoolId(
          dir.schoolId,
          (manager) =>
            manager.findOne(Parent, {
              where: { id: dir.tenantUserId },
              relations: ['role', 'school'],
            }),
        );
        if (parent) {
          parents.push(parent);
        }
      }
      return parents;
    }
    await this.iteration.forEachActiveSchool(async () => {
      const matches = await this.tenantConnection.manager
        .getRepository(Parent)
        .createQueryBuilder('parent')
        .leftJoinAndSelect('parent.role', 'role')
        .leftJoinAndSelect('parent.school', 'school')
        .where('LOWER(parent.email) = :email', { email: email.toLowerCase() })
        .getMany();
      parents.push(...matches);
    });
    return parents;
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
      if (userType === 'school_admin') {
        return manager.findOne(SchoolAdmin, {
          where: { id: userId },
          relations: ['role', 'school'],
        });
      }
      if (userType === 'teacher') {
        return manager.findOne(Teacher, {
          where: { id: userId },
          relations: ['role', 'school'],
        });
      }
      if (userType === 'student') {
        return manager.findOne(Student, {
          where: { id: userId },
          relations: ['role', 'school'],
        });
      }
      if (userType === 'parent') {
        return manager.findOne(Parent, {
          where: { id: userId },
          relations: ['role', 'school'],
        });
      }
      return null;
    });
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
