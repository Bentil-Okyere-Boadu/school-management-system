import { ForbiddenException } from '@nestjs/common';
import { SchoolAdmin } from '../../school-admin/school-admin.entity';
import { Teacher } from '../../teacher/teacher.entity';
import { ClassLevel } from '../../class-level/class-level.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/student/student.entity';
import { Parent } from 'src/parent/parent.entity';

export function assertSchoolAdminSchoolScope(
  user: Teacher | SchoolAdmin | Student | Parent,
  ...schoolIds: string[]
): void {
  if (user.role?.label !== 'School Admin') {
    return;
  }
  const adminSchoolId = (user as SchoolAdmin).school?.id;
  if (!adminSchoolId || schoolIds.some((id) => id !== adminSchoolId)) {
    throw new ForbiddenException('You can only access data for your school');
  }
}

export async function isSchoolAdminOrClassTeacher(
  user: Teacher | SchoolAdmin | Student | Parent,
  classLevelId: string,
  classLevelRepository: Repository<ClassLevel>,
): Promise<boolean> {
  if (user.role?.label === 'School Admin') {
    const classLevel = await classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['school'],
    });
    if (!classLevel) {
      return false;
    }
    const adminSchoolId = (user as SchoolAdmin).school?.id;
    return !!adminSchoolId && classLevel.school.id === adminSchoolId;
  }

  if (user.role?.label === 'Teacher') {
    const classLevel = await classLevelRepository.findOne({
      where: { id: classLevelId },
      relations: ['classTeacher'],
    });
    if (classLevel && classLevel.classTeacher?.id === user.id) {
      return true;
    }
  }

  return false;
}
