import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Role } from '../../auth/enums/role.enum';
import { SKIP_TENANT_SCOPE_KEY } from '../tenant/skip-tenant-scope.decorator';

type RequestWithUser = {
  user?: {
    role?: string | { name?: string };
    schoolId?: string;
    school?: { id?: string };
  };
  tenantId?: string;
};

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipTenantScope = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTenantScope) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Unauthenticated/public route.
    if (!user) {
      return next.handle();
    }

    const roleName =
      typeof user.role === 'string' ? user.role : (user.role?.name ?? '');

    if (roleName === Role.SuperAdmin) {
      return next.handle();
    }

    const tenantId = user.schoolId ?? user.school?.id;

    if (!tenantId) {
      throw new ForbiddenException(
        'Missing tenant context: user is not associated with a school',
      );
    }

    request.tenantId = tenantId;
    // Normalize for existing code paths still reading user.schoolId.
    if (!user.schoolId) {
      user.schoolId = tenantId;
    }

    return next.handle();
  }
}
