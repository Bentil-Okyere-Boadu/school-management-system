import { lastValueFrom, of } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { TenantRequestInterceptor } from './tenant-request.interceptor';
import { TenantConnectionService } from './tenant-connection.service';
import { MissingTenantContextException } from './missing-tenant-context.exception';
import { Role } from '../auth/enums/role.enum';

describe('TenantRequestInterceptor', () => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  } as unknown as Reflector;

  const tenantConnection = {
    runForSchoolId: jest.fn(async (_id: string, fn: () => Promise<unknown>) =>
      fn(),
    ),
  } as unknown as TenantConnectionService;

  const interceptor = new TenantRequestInterceptor(
    reflector,
    tenantConnection,
  );

  function httpContext(user: unknown) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as never;
  }

  it('fail-closed for tenant roles without schoolId', async () => {
    const next = { handle: () => of('ok') };
    await expect(
      lastValueFrom(
        interceptor.intercept(
          httpContext({ role: { name: Role.SchoolAdmin } }),
          next,
        ),
      ),
    ).rejects.toBeInstanceOf(MissingTenantContextException);
    expect(tenantConnection.runForSchoolId).not.toHaveBeenCalled();
  });

  it('binds QueryRunner via runForSchoolId when schoolId is present', async () => {
    const next = { handle: () => of('ok') };
    const result = await lastValueFrom(
      interceptor.intercept(
        httpContext({
          role: { name: Role.SchoolAdmin },
          schoolId: 'school-a',
        }),
        next,
      ),
    );
    expect(result).toBe('ok');
    expect(tenantConnection.runForSchoolId).toHaveBeenCalledWith(
      'school-a',
      expect.any(Function),
    );
  });

  it('does not wrap Super Admin requests', async () => {
    (tenantConnection.runForSchoolId as jest.Mock).mockClear();
    const next = { handle: () => of('catalog') };
    const result = await lastValueFrom(
      interceptor.intercept(
        httpContext({ role: { name: Role.SuperAdmin } }),
        next,
      ),
    );
    expect(result).toBe('catalog');
    expect(tenantConnection.runForSchoolId).not.toHaveBeenCalled();
  });
});
