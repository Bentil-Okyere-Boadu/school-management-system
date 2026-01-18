// backend/src/auth/guards/active-user.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: SuperAdmin }>();
    const user: SuperAdmin = request.user;

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException(
        'Your account is not active. Please contact an administrator.',
      );
    }

    return true;
  }
}
