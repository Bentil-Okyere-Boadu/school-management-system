import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { TeacherService } from 'src/teacher/teacher.service';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';

@Injectable()
export class IsClassTeacherGuard implements CanActivate {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const schoolId = user?.schoolId ?? user?.school?.id;

    if (!schoolId) {
      throw new UnauthorizedException(
        'You are not the class teacher for this class or student',
      );
    }

    // Take from params OR body
    const { classLevelId, studentId } = {
      classLevelId: request.params?.classLevelId ?? request.body?.classLevelId,
      studentId: request.params?.studentId ?? request.body?.studentId,
    };

    const { isClassTeacher } = await this.tenantConnection.runForSchoolId(
      schoolId,
      async () =>
        this.teacherService.checkIfClassTeacher(
          user.id,
          classLevelId,
          studentId,
        ),
    );

    if (!isClassTeacher) {
      throw new UnauthorizedException(
        'You are not the class teacher for this class or student',
      );
    }

    return true;
  }
}
