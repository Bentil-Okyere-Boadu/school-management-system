import { Injectable, Optional } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';

@Injectable()
export class TransactionUtil {
  constructor(
    private dataSource: DataSource,
    @Optional() private readonly tenantConnection?: TenantConnectionService,
  ) {}

  async executeInTransaction<T>(
    fn: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const store = this.tenantConnection?.tryGetStore();
    if (store) {
      await store.queryRunner.startTransaction();
      try {
        const result = await fn(store.manager);
        await store.queryRunner.commitTransaction();
        return result;
      } catch (error) {
        await store.queryRunner.rollbackTransaction();
        throw error;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await fn(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
