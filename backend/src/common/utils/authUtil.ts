import { SchoolAdmin } from '../../school-admin/school-admin.entity';
import { Teacher } from '../../teacher/teacher.entity';
import { ClassLevel } from '../../class-level/class-level.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/student/student.entity';

export async function isSchoolAdminOrClassTeacher(
  user: Teacher | SchoolAdmin | Student,
  classLevelId: string,
  classLevelRepository: Repository<ClassLevel>,
): Promise<boolean> {
  if (user.role.label === 'School Admin') {
    return true;
  }

  if (user.role.label === 'Teacher') {
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
