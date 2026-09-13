import { ForbiddenException } from '@nestjs/common';

export class MissingTenantContextException extends ForbiddenException {
  constructor(message = 'Tenant context is required for this operation') {
    super(message);
  }
}
