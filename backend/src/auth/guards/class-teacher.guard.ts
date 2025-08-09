import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { Student } from 'src/student/student.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IsClassTeacherGuard implements CanActivate {
  constructor(
    @InjectRepository(ClassLevel)
    private classLevelRepo: Repository<ClassLevel>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { classLevelId, studentId } = request.params as {
      classLevelId: string;
      studentId: string;
    };

    let isClassTeacher = false;

    if (classLevelId) {
      const classLevel = await this.classLevelRepo
        .createQueryBuilder('classLevel')
        .leftJoin('classLevel.classTeacher', 'classTeacher')
        .where('classLevel.id = :id', { id: classLevelId })
        .select(['classLevel.id', 'classTeacher.id'])
        .getOne();

      if (!classLevel) {
        throw new UnauthorizedException('Class not found');
      }
      isClassTeacher = classLevel?.classTeacher?.id === user.id;
    } else if (studentId) {
      const student = await this.studentRepo.findOne({
        where: { id: studentId },
        relations: ['classLevels', 'classLevels.classTeacher'],
      });

      if (!student) {
        throw new UnauthorizedException('Student not found');
      }

      isClassTeacher = student.classLevels.some(
        (classLevel) => classLevel?.classTeacher?.id === user.id,
      );
    } else {
      throw new UnauthorizedException('No class or student ID provided');
    }

    if (!isClassTeacher) {
      throw new UnauthorizedException(
        'You are not the class teacher for this class or student',
      );
    }

    return true;
  }
}
