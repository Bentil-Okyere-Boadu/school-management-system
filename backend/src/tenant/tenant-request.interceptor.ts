import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, lastValueFrom, Observable, throwError } from 'rxjs';
import { SKIP_TENANT_SCOPE_KEY } from '../common/tenant/skip-tenant-scope.decorator';
import { TenantConnectionService } from './tenant-connection.service';
import { Role } from '../auth/enums/role.enum';
import { MissingTenantContextException } from './missing-tenant-context.exception';

const TENANT_ROLES = new Set<string>([
  Role.SchoolAdmin,
  Role.Teacher,
  Role.Student,
  Role.Parent,
]);

@Injectable()
export class TenantRequestInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role?: string | { name?: string }; schoolId?: string };
    }>();
    const user = request.user;
    const roleName =
      typeof user?.role === 'string' ? user.role : (user?.role?.name ?? '');
    if (!user || roleName === Role.SuperAdmin) {
      return next.handle();
    }
    const schoolId = user.schoolId;
    if (TENANT_ROLES.has(roleName) && !schoolId) {
      return throwError(() => new MissingTenantContextException());
    }
    if (!schoolId) {
      return next.handle();
    }

    return from(
      this.tenantConnection.runForSchoolId(schoolId, async () => {
        return lastValueFrom(next.handle());
      }),
    );
  }
}
