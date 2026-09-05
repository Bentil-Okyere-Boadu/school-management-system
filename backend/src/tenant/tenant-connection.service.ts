import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { MissingTenantContextException } from './missing-tenant-context.exception';
import { quotePgIdent } from './tenant-schema.util';
import { TenantResolverService } from './tenant-resolver.service';
import { SchoolProvisioningStatus } from './school-provisioning-status';

type TenantStore = {
  schoolId: string;
  schemaName: string;
  queryRunner: QueryRunner;
  manager: EntityManager;
};

@Injectable()
export class TenantConnectionService {
  private readonly als = new AsyncLocalStorage<TenantStore>();

  constructor(
    private readonly dataSource: DataSource,
    private readonly resolver: TenantResolverService,
  ) {}

  tryGetStore(): TenantStore | undefined {
    return this.als.getStore();
  }

  getStore(): TenantStore {
    const store = this.tryGetStore();
    if (!store) {
      throw new MissingTenantContextException();
    }
    return store;
  }

  get manager(): EntityManager {
    return this.getStore().manager;
  }

  async runForSchoolId<T>(
    schoolId: string,
    fn: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const resolved = await this.resolver.resolveBySchoolId(schoolId);
    if (resolved.isDisabled) {
      throw new MissingTenantContextException('School is disabled');
    }
    if (resolved.status !== SchoolProvisioningStatus.Active) {
      throw new MissingTenantContextException(
        'School tenant is not active',
      );
    }
    return this.runInSchema(resolved.schoolId, resolved.schemaName, fn);
  }

  async runInSchema<T>(
    schoolId: string,
    schemaName: string,
    fn: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(
        `SET search_path TO ${quotePgIdent(schemaName)}, public`,
      );
      const store: TenantStore = {
        schoolId,
        schemaName,
        queryRunner,
        manager: queryRunner.manager,
      };
      return await this.als.run(store, () => fn(queryRunner.manager));
    } finally {
      await queryRunner.query(`SET search_path TO public`);
      await queryRunner.release();
    }
  }
}
