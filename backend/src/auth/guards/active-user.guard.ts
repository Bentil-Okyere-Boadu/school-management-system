// backend/src/auth/guards/active-user.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/user/user.entity';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user: User = request.user;

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException(
        'Your account is not active. Please contact an administrator.',
      );
    }

    return true;
  }
}
