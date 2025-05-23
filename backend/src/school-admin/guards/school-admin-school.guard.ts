import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SchoolAdmin } from '../school-admin.entity';

@Injectable()
export class SchoolAdminSchoolGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const admin: SchoolAdmin = request.user;

    if (!admin.school || !admin.school.id) {
      throw new ForbiddenException(
        'You are not yet associated with any school.',
      );
    }

    return true;
  }
}
