import { DataSource, QueryRunner } from 'typeorm';
import { School } from 'src/school/school.entity';
import { SchoolProvisioningStatus } from './school-provisioning-status';
import { TenantMigrationStatus } from './tenant-migration-status';
import { TenantSchemaMigrator } from './tenant-schema-migrator.service';
import { TenantMigrationStep } from './tenant-migration.types';

function mockSchool(overrides: Partial<School> = {}): School {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    schemaName: 'tenant_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    provisioningStatus: SchoolProvisioningStatus.Active,
    isDisabled: false,
    tenantSchemaVersion: 0,
    tenantMigrationStatus: TenantMigrationStatus.Ok,
    ...overrides,
  } as School;
}

describe('TenantSchemaMigrator', () => {
  let migrator: TenantSchemaMigrator;
  let schoolRepo: {
    find: jest.Mock;
    update: jest.Mock;
  };
  let lockRunner: {
    connect: jest.Mock;
    query: jest.Mock;
    release: jest.Mock;
  };
  let tenantRunner: jest.Mocked<Partial<QueryRunner>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  beforeEach(() => {
    schoolRepo = {
      find: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    lockRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([{ locked: true }]),
      release: jest.fn().mockResolvedValue(undefined),
    };
    tenantRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue(undefined),
      manager: {
        update: jest.fn().mockResolvedValue(undefined),
      } as unknown as QueryRunner['manager'],
    };
    dataSource = {
      getRepository: jest.fn().mockReturnValue(schoolRepo),
      createQueryRunner: jest
        .fn()
        .mockReturnValueOnce(lockRunner)
        .mockReturnValue(tenantRunner),
    };
    migrator = new TenantSchemaMigrator(dataSource as DataSource);
  });

  it('skips schools already at HEAD', async () => {
    schoolRepo.find.mockResolvedValue([
      mockSchool({ tenantSchemaVersion: 0 }),
    ]);

    const summary = await migrator.migrateAll({
      head: 0,
      skipAdvisoryLock: true,
    });

    expect(summary.skipped).toBe(1);
    expect(summary.ok).toBe(0);
    expect(summary.failed).toBe(0);
  });

  it('isolates failure to one tenant without affecting others', async () => {
    const okSchool = mockSchool({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      schemaName: 'tenant_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      tenantSchemaVersion: 0,
    });
    const failSchool = mockSchool({
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      schemaName: 'tenant_cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      tenantSchemaVersion: 0,
    });
    schoolRepo.find.mockResolvedValue([okSchool, failSchool]);

    const steps: TenantMigrationStep[] = [
      {
        version: 901,
        name: 'ok-step',
        up: async (_qr, schemaName) => {
          if (schemaName.includes('cccccccc')) {
            throw new Error('forced failure');
          }
        },
      },
    ];

    dataSource.createQueryRunner = jest
      .fn()
      .mockReturnValueOnce(lockRunner)
      .mockReturnValueOnce({ ...tenantRunner })
      .mockReturnValueOnce({ ...tenantRunner });

    const summary = await migrator.migrateAll({
      head: 901,
      steps,
      skipAdvisoryLock: true,
    });

    expect(summary.ok).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.failures).toHaveLength(1);
    expect(summary.failures[0].schoolId).toBe(failSchool.id);
  });

  it('throws when advisory lock is held', async () => {
    lockRunner.query.mockResolvedValue([{ locked: false }]);

    await expect(
      migrator.migrateAll({ head: 0, skipAdvisoryLock: false }),
    ).rejects.toThrow(/advisory lock/);
  });
});
