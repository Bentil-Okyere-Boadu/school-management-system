import { Injectable } from '@nestjs/common';
import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { TenantConnectionService } from './tenant-connection.service';

@Injectable()
export class TenantOrmService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  get<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    return this.tenantConnection.manager.getRepository(entity);
  }
}
