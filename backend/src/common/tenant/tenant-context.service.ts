import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

type TenantAwareRequest = {
  tenantId?: string;
  user?: {
    schoolId?: string;
    school?: { id?: string };
  };
};

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private readonly request: TenantAwareRequest) {}

  getTenantIdOrThrow(): string {
    const tenantId =
      this.request.tenantId ||
      this.request.user?.schoolId ||
      this.request.user?.school?.id;

    if (!tenantId) {
      throw new Error('Tenant context is missing from the current request');
    }

    return tenantId;
  }

  getTenantId(): string | undefined {
    return (
      this.request.tenantId ||
      this.request.user?.schoolId ||
      this.request.user?.school?.id
    );
  }
}
