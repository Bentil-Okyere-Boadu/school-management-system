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
    const dirs = await this.directory.findByLogin(identifier, 'teacher');
    if (dirs.length === 1) {
      return this.loadTeacher(dirs[0].schoolId, dirs[0].tenantUserId);
    }
    const school = await this.schoolFromCodePrefix(identifier);
    if (school) {
      return this.tenantConnection.runForSchoolId(school.id, (manager) =>
        manager.findOne(Teacher, {
          where: [{ email: identifier }, { teacherId: identifier }],
          relations: ['role', 'school'],
        }),
      );
    }
    let found: Teacher | null = null;
    await this.iteration.forEachActiveSchool(async (schoolId) => {
      if (found) {
        return;
      }
      const teacher = await this.tenantConnection.manager.findOne(Teacher, {
        where: [{ email: identifier }, { teacherId: identifier }],
        relations: ['role', 'school'],
      });
      if (teacher) {
        found = teacher;
        await this.directory.upsert({
          loginKey: identifier,
          userType: 'teacher',
          schoolId,
          tenantUserId: teacher.id,
        });
      }
    });
    return found;
  }

  async findStudent(identifier: string): Promise<Student | null> {
    const dirs = await this.directory.findByLogin(identifier, 'student');
    if (dirs.length === 1) {
      return this.tenantConnection.runForSchoolId(
        dirs[0].schoolId,
        (manager) =>
          manager.findOne(Student, {
            where: { id: dirs[0].tenantUserId },
            relations: ['role', 'school'],
          }),
      );
    }
    const school = await this.schoolFromCodePrefix(identifier);
    if (school) {
      return this.tenantConnection.runForSchoolId(school.id, (manager) =>
        manager.findOne(Student, {
          where: [{ email: identifier }, { studentId: identifier }],
          relations: ['role', 'school'],
        }),
      );
    }
    let found: Student | null = null;
    await this.iteration.forEachActiveSchool(async (schoolId) => {
      if (found) {
        return;
      }
      const student = await this.tenantConnection.manager.findOne(Student, {
        where: [{ email: identifier }, { studentId: identifier }],
        relations: ['role', 'school'],
      });
      if (student) {
        found = student;
        await this.directory.upsert({
          loginKey: identifier,
          userType: 'student',
          schoolId,
          tenantUserId: student.id,
        });
      }
    });
    return found;
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

  private loadTeacher(schoolId: string, id: string): Promise<Teacher | null> {
    return this.tenantConnection.runForSchoolId(schoolId, (manager) =>
      manager.findOne(Teacher, {
        where: { id },
        relations: ['role', 'school'],
      }),
    );
  }

  private async schoolFromCodePrefix(identifier: string): Promise<School | null> {
    const code = identifier.split('-')[0];
    if (!code) {
      return null;
    }
    return this.schoolRepository.findOne({
      where: {
        schoolCode: code,
        provisioningStatus: SchoolProvisioningStatus.Active,
        isDisabled: false,
      },
    });
  }
}
