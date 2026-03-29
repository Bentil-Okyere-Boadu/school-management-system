import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { TenantContextInterceptor } from './tenant-context.interceptor';

describe('TenantContextInterceptor', () => {
  const next = { handle: jest.fn(() => of(null)) };

  const buildContext = (request: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  it('attaches tenantId from schoolId for tenant users', (done) => {
    const reflector = {
      getAllAndOverride: jest.fn(() => false),
    } as unknown as Reflector;
    const interceptor = new TenantContextInterceptor(reflector);
    const request: any = {
      user: { role: 'school_admin', schoolId: 'school-1' },
    };

    interceptor.intercept(buildContext(request), next).subscribe(() => {
      expect(request.tenantId).toBe('school-1');
      done();
    });
  });

  it('does not enforce tenant on super admin', (done) => {
    const reflector = {
      getAllAndOverride: jest.fn(() => false),
    } as unknown as Reflector;
    const interceptor = new TenantContextInterceptor(reflector);
    const request: any = { user: { role: 'super_admin' } };

    interceptor.intercept(buildContext(request), next).subscribe(() => {
      expect(request.tenantId).toBeUndefined();
      done();
    });
  });
});
