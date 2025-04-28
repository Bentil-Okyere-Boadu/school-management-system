// backend/src/auth/guards/auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ActiveUserGuard } from './active-user.guard';

@Injectable()
export class AuthGuard extends JwtAuthGuard {
  constructor(private activeUserGuard: ActiveUserGuard) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);

    if (isAuthenticated) {
      return this.activeUserGuard.canActivate(context);
    }

    return false;
  }
}
