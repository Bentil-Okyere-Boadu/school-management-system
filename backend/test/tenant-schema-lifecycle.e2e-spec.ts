import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { School } from '../src/school/school.entity';
import { TenantProvisionerService } from '../src/tenant/tenant-provisioner.service';
import { TenantSchemaInspector } from '../src/tenant/tenant-schema-inspector.service';
import { TenantSchemaMigrator } from '../src/tenant/tenant-schema-migrator.service';
import { SchoolProvisioningStatus } from '../src/tenant/school-provisioning-status';
import { TenantMigrationStatus } from '../src/tenant/tenant-migration-status';
import { TENANT_SCHEMA_HEAD } from '../src/tenant/tenant-schema-version';
import { tenantSchemaName } from '../src/tenant/tenant-schema.util';
import { loadProductionRegistry } from '../src/tenant/tenant-migration-registry';
import { PLATFORM_PUBLIC_TABLES } from '../src/tenant/legacy-public-tenant-tables';
import { bootstrapTenantE2eDataSource } from './helpers/tenant-e2e-bootstrap';
import {
  TEST_TENANT_SCHEMA_HEAD,
  buildTestTenantRegistry,
} from './fixtures/tenant-migrations';
import { TenantMigrationStep } from '../src/tenant/tenant-migration.types';

config();

jest.setTimeout(10 * 60 * 1000);

describe('Tenant schema lifecycle (Phase 6)', () => {
  let ds: DataSource;
  let provisioner: TenantProvisionerService;
  let inspector: TenantSchemaInspector;
  let migrator: TenantSchemaMigrator;
  const runId = randomUUID().slice(0, 8);
  const schoolIds: string[] = [];
  const schemaNames: string[] = [];

  const testRegistry = buildTestTenantRegistry(loadProductionRegistry());

  async function createSchool(label: string): Promise<School> {
    const repo = ds.getRepository(School);
    return repo.save(
      repo.create({
        name: `Lifecycle ${label} ${runId}`,
        calendlyUrl: `https://example.com/lifecycle-${label}-${runId}`,
        provisioningStatus: SchoolProvisioningStatus.Provisioning,
      }),
    );
  }

  async function provision(label: string): Promise<{ school: School; schema: string }> {
    const school = await createSchool(label);
    const provisioned = await provisioner.provision(school);
    const schema = tenantSchemaName(provisioned.id);
    schoolIds.push(provisioned.id);
    schemaNames.push(schema);
    return { school: provisioned, schema };
  }

  async function migrateAll(
    steps = testRegistry,
    head = TEST_TENANT_SCHEMA_HEAD,
  ) {
    return migrator.migrateAll({
      steps,
      head,
      skipAdvisoryLock: true,
    });
  }

  async function columnNames(schema: string, table: string): Promise<string[]> {
    const rows: Array<{ column_name: string }> = await ds.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [schema, table],
    );
    return rows.map((r) => r.column_name);
  }

  async function tableExists(schema: string, table: string): Promise<boolean> {
    const rows: Array<{ reg: string | null }> = await ds.query(
      `SELECT to_regclass($1) AS reg`,
      [`"${schema}"."${table}"`],
    );
    return rows[0].reg !== null;
  }

  async function indexExists(schema: string, indexName: string): Promise<boolean> {
    const rows: Array<{ idx: string | null }> = await ds.query(
      `SELECT to_regclass($1) AS idx`,
      [`"${schema}"."${indexName}"`],
    );
    return rows[0]?.idx !== null;
  }

  async function reloadSchool(id: string): Promise<School> {
    return ds.getRepository(School).findOneByOrFail({ id });
  }

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'school_management',
      entities: [__dirname + '/../src/**/*.entity.{ts,js}'],
      migrations: [__dirname + '/../src/migrations/*.{ts,js}'],
      synchronize: false,
      migrationsRun: true,
    });
    await ds.initialize();
    await bootstrapTenantE2eDataSource(ds);
    inspector = new TenantSchemaInspector(ds);
    provisioner = new TenantProvisionerService(ds, inspector);
    migrator = new TenantSchemaMigrator(ds);
  });

  afterAll(async () => {
    if (ds?.isInitialized) {
      for (const schema of schemaNames) {
        await ds.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      }
      if (schoolIds.length) {
        await ds.query(`DELETE FROM public.school WHERE id = ANY($1::uuid[])`, [
          schoolIds,
        ]);
      }
      await ds.destroy();
    }
  });

  it('new provisioned tenant starts at production HEAD', async () => {
    const { school } = await provision('new-head');
    expect(school.tenantSchemaVersion).toBe(TENANT_SCHEMA_HEAD);
    expect(school.tenantMigrationStatus).toBe(TenantMigrationStatus.Ok);
  });

  it('existing tenant upgrades through test migrations', async () => {
    const { school, schema } = await provision('upgrade-one');
    expect(school.tenantSchemaVersion).toBe(TENANT_SCHEMA_HEAD);

    const summary = await migrateAll();
    expect(summary.ok).toBeGreaterThanOrEqual(1);

    const updated = await reloadSchool(school.id);
    expect(updated.tenantSchemaVersion).toBe(TEST_TENANT_SCHEMA_HEAD);
    expect(updated.tenantMigrationStatus).toBe(TenantMigrationStatus.Ok);
    expect(await columnNames(schema, 'student')).toContain('_lifecycleTestCol');
    expect(await tableExists(schema, '_lifecycle_test_table')).toBe(true);
    expect(await indexExists(schema, '_lifecycle_test_col_idx')).toBe(true);
  });

  it('multiple tenants upgrade independently', async () => {
    const a = await provision('multi-a');
    const b = await provision('multi-b');
    const c = await provision('multi-c');

    const summary = await migrateAll();
    expect(summary.ok).toBeGreaterThanOrEqual(3);

    for (const { school } of [a, b, c]) {
      const updated = await reloadSchool(school.id);
      expect(updated.tenantSchemaVersion).toBe(TEST_TENANT_SCHEMA_HEAD);
      expect(updated.tenantMigrationStatus).toBe(TenantMigrationStatus.Ok);
    }
  });

  it('already-current tenants are skipped on re-run', async () => {
    const summary = await migrateAll();
    expect(summary.skipped).toBeGreaterThanOrEqual(1);
    expect(summary.failed).toBe(0);
  });

  it('one tenant failure does not corrupt others', async () => {
    const okTenant = await provision('fail-ok');
    const failTenant = await provision('fail-bad');
    const failSchema = failTenant.schema;

    const failingRegistry: TenantMigrationStep[] = [
      ...testRegistry,
      {
        version: 904,
        name: 'forced-failure',
        up: async (_qr, schemaName) => {
          if (schemaName === failSchema) {
            throw new Error('forced lifecycle failure');
          }
        },
      },
    ];

    const summary = await migrator.migrateAll({
      steps: failingRegistry,
      head: 904,
      skipAdvisoryLock: true,
    });
    expect(summary.failed).toBeGreaterThanOrEqual(1);

    const okUpdated = await reloadSchool(okTenant.school.id);
    const failUpdated = await reloadSchool(failTenant.school.id);

    expect(okUpdated.tenantSchemaVersion).toBe(904);
    expect(okUpdated.tenantMigrationStatus).toBe(TenantMigrationStatus.Ok);
    expect(failUpdated.tenantMigrationStatus).toBe(TenantMigrationStatus.Failed);
    expect(failUpdated.tenantSchemaVersion).toBe(TENANT_SCHEMA_HEAD);
    expect(failUpdated.lastTenantMigrationError).toContain('forced lifecycle failure');
  });

  it('failed tenant can be retried after fix', async () => {
    const failSchool = await ds
      .getRepository(School)
      .findOneByOrFail({ name: `Lifecycle fail-bad ${runId}` });

    const summary = await migrateAll();
    expect(summary.ok).toBeGreaterThanOrEqual(1);

    const updated = await reloadSchool(failSchool.id);
    expect(updated.tenantSchemaVersion).toBe(TEST_TENANT_SCHEMA_HEAD);
    expect(updated.tenantMigrationStatus).toBe(TenantMigrationStatus.Ok);
  });

  it('tenant A migration does not alter tenant B schema', async () => {
    const tenantB = await provision('isolate-b');
    await migrateAll();
    const bColsBefore = await columnNames(tenantB.schema, 'student');

    const tenantA = await provision('isolate-a');
    await migrateAll();
    const bColsAfter = await columnNames(tenantB.schema, 'student');

    expect(await columnNames(tenantA.schema, 'student')).toContain(
      '_lifecycleTestCol',
    );
    expect(bColsBefore).toEqual(bColsAfter);
  });

  it('public operational tables are never created by tenant migrations', async () => {
    for (const table of ['student', 'teacher', 'parent']) {
      expect(PLATFORM_PUBLIC_TABLES).not.toContain(table);
      const rows: Array<{ reg: string | null }> = await ds.query(
        `SELECT to_regclass($1) AS reg`,
        [`public.${table}`],
      );
      expect(rows[0]?.reg).toBeNull();
    }
  });

  it('fresh provision then migrate matches legacy migrate at test HEAD', async () => {
    const legacy = await provision('equiv-legacy');
    await migrateAll();

    const fresh = await provision('equiv-fresh');
    await migrateAll();

    const qr = ds.createQueryRunner();
    await qr.connect();
    try {
      const legacyFp = await inspector.buildActualFingerprint(qr, legacy.schema);
      const freshFp = await inspector.buildActualFingerprint(qr, fresh.schema);

      const legacyTestCol = legacyFp.get('student')?.find((c) =>
        c.startsWith('_lifecycleTestCol:'),
      );
      const freshTestCol = freshFp.get('student')?.find((c) =>
        c.startsWith('_lifecycleTestCol:'),
      );
      expect(legacyTestCol).toBeDefined();
      expect(freshTestCol).toBe(legacyTestCol);

      inspector.assertFingerprintsEqual(legacyFp, freshFp);
    } finally {
      await qr.release();
    }
  });
});
