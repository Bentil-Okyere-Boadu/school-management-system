import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentStudent } from './parent-student.entity';
import { ParentStudentStatus } from './parent.enums';
import { TenantContextService } from 'src/common/tenant/tenant-context.service';
import { Student } from 'src/student/student.entity';

@Injectable()
export class ParentAuthorizationService {
  constructor(
    @InjectRepository(ParentStudent)
    private readonly parentStudentRepository: Repository<ParentStudent>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async requireActiveParentStudent(
    parentId: string,
    studentId: string,
  ): Promise<{ link: ParentStudent; student: Student }> {
    const tenantId = this.tenantContext.getTenantIdOrThrow();

    const link = await this.parentStudentRepository.findOne({
      where: {
        parent: { id: parentId },
        student: { id: studentId },
        status: ParentStudentStatus.Active,
      },
      relations: [
        'parent',
        'parent.school',
        'student',
        'student.school',
        'student.classLevels',
        'student.profile',
        'school',
      ],
    });

    if (!link?.student) {
      throw new ForbiddenException(
        'You are not authorized to access this student',
      );
    }

    const studentSchoolId = link.student.school?.id;
    const parentSchoolId = link.parent?.school?.id;
    const linkSchoolId = link.school?.id;

    if (
      studentSchoolId !== tenantId ||
      parentSchoolId !== tenantId ||
      (linkSchoolId && linkSchoolId !== tenantId)
    ) {
      throw new ForbiddenException(
        'You are not authorized to access this student',
      );
    }

    return { link, student: link.student };
  }

  async getActiveChildren(parentId: string): Promise<Student[]> {
    const tenantId = this.tenantContext.getTenantIdOrThrow();
    const links = await this.parentStudentRepository.find({
      where: {
        parent: { id: parentId },
        status: ParentStudentStatus.Active,
        school: { id: tenantId },
      },
      relations: [
        'student',
        'student.school',
        'student.classLevels',
        'student.profile',
        'school',
      ],
    });

    return links
      .map((link) => link.student)
      .filter((student): student is Student => !!student);
  }

  async requireOwnedStudent(studentId: string, callerStudentId: string) {
    if (studentId !== callerStudentId) {
      throw new ForbiddenException(
        'You can only manage guardians for your own profile',
      );
    }
    return studentId;
  }

  async requireLinkInSchool(linkId: string, schoolId: string) {
    const link = await this.parentStudentRepository.findOne({
      where: { id: linkId, school: { id: schoolId } },
      relations: ['parent', 'parent.school', 'student', 'student.school', 'school'],
    });
    if (!link) {
      throw new NotFoundException('Parent relationship not found');
    }
    return link;
  }
}
