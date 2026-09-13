import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { TransactionUtil } from './transaction.util';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';

describe('TransactionUtil', () => {
  it('starts a transaction on the tenant store queryRunner when present', async () => {
    const queryRunner = {
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {} as EntityManager,
    } as unknown as QueryRunner;

    const tenantConnection = {
      tryGetStore: jest.fn().mockReturnValue({
        queryRunner,
        manager: queryRunner.manager,
      }),
    } as unknown as TenantConnectionService;

    const dataSource = {
      createQueryRunner: jest.fn(),
    } as unknown as DataSource;

    const util = new TransactionUtil(dataSource, tenantConnection);
    const result = await util.executeInTransaction(async () => 'done');

    expect(result).toBe('done');
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('uses a standalone queryRunner when no tenant store is present', async () => {
    const queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {} as EntityManager,
    } as unknown as QueryRunner;

    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;

    const util = new TransactionUtil(dataSource);
    await util.executeInTransaction(async () => 'standalone');

    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});
