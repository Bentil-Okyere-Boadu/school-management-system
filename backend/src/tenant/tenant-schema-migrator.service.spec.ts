import { ConflictException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { School } from 'src/school/school.entity';
import { SchoolProvisioningStatus } from './school-provisioning-status';
import { TenantMigrationStatus } from './tenant-migration-status';
import { TenantSchemaMigrator } from './tenant-schema-migrator.service';
import { TenantSchemaInspector } from './tenant-schema-inspector.service';
import { TenantMigrationStep } from './tenant-migration.types';
import { TENANT_SCHEMA_HEAD } from './tenant-schema-version';

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
  let classifySchemaDrift: jest.SpyInstance;
  let assertSchemaMatchesHead: jest.SpyInstance;
  let schoolRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
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
      findOne: jest.fn(),
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
    classifySchemaDrift = jest
      .spyOn(
        migrator as unknown as {
          classifySchemaDrift: (
            schemaName: string,
          ) => Promise<'none' | 'columns' | 'tables'>;
        },
        'classifySchemaDrift',
      )
      .mockResolvedValue('none');
    assertSchemaMatchesHead = jest
      .spyOn(TenantSchemaInspector.prototype, 'assertSchemaMatchesHead')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    classifySchemaDrift.mockRestore();
    assertSchemaMatchesHead.mockRestore();
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
    schoolRepo.findOne.mockImplementation(({ where: { id } }) => {
      if (id === okSchool.id) {
        return Promise.resolve(okSchool);
      }
      if (id === failSchool.id) {
        return Promise.resolve(failSchool);
      }
      return Promise.resolve(null);
    });

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

  it('migrateSchool acquires advisory lock when skipAdvisoryLock is false', async () => {
    const school = mockSchool({ tenantSchemaVersion: 0 });
    schoolRepo.findOne.mockResolvedValue(school);

    dataSource.createQueryRunner = jest
      .fn()
      .mockReturnValueOnce(lockRunner)
      .mockReturnValueOnce({ ...tenantRunner });

    await migrator.migrateSchool(school.id, {
      head: 0,
      skipAdvisoryLock: false,
    });

    expect(lockRunner.query).toHaveBeenCalledWith(
      `SELECT pg_try_advisory_lock($1) AS locked`,
      expect.any(Array),
    );
  });

  it('migrateSchool throws ConflictException when advisory lock is held', async () => {
    lockRunner.query.mockResolvedValue([{ locked: false }]);
    dataSource.createQueryRunner = jest.fn().mockReturnValueOnce(lockRunner);

    await expect(
      migrator.migrateSchool('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {
        head: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('replays incrementals on column drift and verifies schema before marking ok', async () => {
    const driftedSchool = mockSchool({
      tenantSchemaVersion: TENANT_SCHEMA_HEAD,
    });
    schoolRepo.findOne
      .mockResolvedValueOnce(driftedSchool)
      .mockResolvedValueOnce({
        ...driftedSchool,
        tenantMigrationStatus: TenantMigrationStatus.Ok,
      });
    classifySchemaDrift.mockResolvedValue('columns');

    const steps: TenantMigrationStep[] = [
      {
        version: 1,
        name: 'add-column',
        up: jest.fn().mockResolvedValue(undefined),
      },
    ];

    dataSource.createQueryRunner = jest.fn().mockReturnValue({ ...tenantRunner });

    await migrator.migrateSchool(driftedSchool.id, {
      head: TENANT_SCHEMA_HEAD,
      steps,
      skipAdvisoryLock: true,
    });

    expect(steps[0].up).toHaveBeenCalled();
    expect(assertSchemaMatchesHead).toHaveBeenCalled();
    expect(tenantRunner.manager!.update).toHaveBeenCalledWith(
      School,
      driftedSchool.id,
      expect.objectContaining({
        tenantMigrationStatus: TenantMigrationStatus.Ok,
        tenantSchemaVersion: TENANT_SCHEMA_HEAD,
      }),
    );
  });

  it('marks failed when schema still does not match HEAD after replay', async () => {
    const driftedSchool = mockSchool({
      tenantSchemaVersion: TENANT_SCHEMA_HEAD,
    });
    schoolRepo.findOne.mockResolvedValue(driftedSchool);
    classifySchemaDrift.mockResolvedValue('columns');
    assertSchemaMatchesHead.mockRejectedValue(
      new Error('Tenant schema does not match HEAD 1'),
    );

    const steps: TenantMigrationStep[] = [
      {
        version: 1,
        name: 'add-column',
        up: jest.fn().mockResolvedValue(undefined),
      },
    ];

    dataSource.createQueryRunner = jest.fn().mockReturnValue({ ...tenantRunner });

    await expect(
      migrator.migrateSchool(driftedSchool.id, {
        head: TENANT_SCHEMA_HEAD,
        steps,
        skipAdvisoryLock: true,
      }),
    ).rejects.toThrow(/does not match HEAD/);

    expect(tenantRunner.rollbackTransaction).toHaveBeenCalled();
    expect(schoolRepo.update).toHaveBeenCalledWith(
      driftedSchool.id,
      expect.objectContaining({
        tenantMigrationStatus: TenantMigrationStatus.Failed,
      }),
    );
  });

  it('migrateSchool heals failed status when schema version is already at HEAD', async () => {
    const failedAtHead = mockSchool({
      tenantSchemaVersion: 0,
      tenantMigrationStatus: TenantMigrationStatus.Failed,
      lastTenantMigrationError: 'previous failure',
    });
    const healed = {
      ...failedAtHead,
      tenantMigrationStatus: TenantMigrationStatus.Ok,
      lastTenantMigrationError: null,
    };

    schoolRepo.findOne
      .mockResolvedValueOnce(failedAtHead)
      .mockResolvedValueOnce(healed);

    dataSource.createQueryRunner = jest.fn().mockReturnValueOnce(lockRunner);

    const result = await migrator.migrateSchool(failedAtHead.id, {
      head: 0,
      skipAdvisoryLock: false,
    });

    expect(schoolRepo.update).toHaveBeenCalledWith(failedAtHead.id, {
      tenantMigrationStatus: TenantMigrationStatus.Ok,
      lastTenantMigrationError: null,
      lastTenantMigrationAt: expect.any(Date),
    });
    expect(result.tenantMigrationStatus).toBe(TenantMigrationStatus.Ok);
  });
});
