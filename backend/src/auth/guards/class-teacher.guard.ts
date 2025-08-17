import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { TeacherService } from 'src/teacher/teacher.service';

@Injectable()
export class IsClassTeacherGuard implements CanActivate {
  constructor(private readonly teacherService: TeacherService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { classLevelId, studentId } = request.params as {
      classLevelId?: string;
      studentId?: string;
    };

    const { isClassTeacher } = await this.teacherService.checkIfClassTeacher(
      user.id,
      classLevelId,
      studentId,
    );

    if (!isClassTeacher) {
      throw new UnauthorizedException(
        'You are not the class teacher for this class or student',
      );
    }

    return true;
  }
}
