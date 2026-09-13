/**
 * Phase 6 probe — tenant schema lifecycle experiment.
 * Temporary; does not modify production src/. Run once to gather evidence:
 *   npx jest --config ./test/jest-e2e.json --runInBand tenant-schema-lifecycle-probe
 */
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { School } from '../src/school/school.entity';
import { TenantProvisionerService } from '../src/tenant/tenant-provisioner.service';
import { TenantSchemaInspector } from '../src/tenant/tenant-schema-inspector.service';
import { SchoolProvisioningStatus } from '../src/tenant/school-provisioning-status';
import { tenantSchemaName } from '../src/tenant/tenant-schema.util';
import {
  applyTenantSchemaTables,
} from '../src/tenant/tenant-ddl';
import { collectTenantMetadatas } from '../src/tenant/tenant-metadata';
import { bootstrapTenantE2eDataSource } from './helpers/tenant-e2e-bootstrap';

config();

jest.setTimeout(5 * 60 * 1000);

describe('Tenant schema lifecycle probe (read-only architecture experiment)', () => {
  let ds: DataSource;
  let provisioner: TenantProvisionerService;
  const runId = randomUUID().slice(0, 8);
  const schoolIds: string[] = [];
  const schemaNames: string[] = [];

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

  async function createCatalogSchool(label: string): Promise<School> {
    const repo = ds.getRepository(School);
    return repo.save(
      repo.create({
        name: `Lifecycle probe ${label} ${runId}`,
        calendlyUrl: `https://example.com/lifecycle-${label}-${runId}`,
        provisioningStatus: SchoolProvisioningStatus.Provisioning,
      }),
    );
  }

  async function provision(label: string): Promise<{ school: School; schema: string }> {
    const school = await createCatalogSchool(label);
    const provisioned = await provisioner.provision(school);
    const schema = tenantSchemaName(provisioned.id);
    schoolIds.push(provisioned.id);
    schemaNames.push(schema);
    return { school: provisioned, schema };
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
      migrationsRun: false,
    });
    await ds.initialize();
    await bootstrapTenantE2eDataSource(ds);
    provisioner = new TenantProvisionerService(
      ds,
      new TenantSchemaInspector(ds),
    );
  });

  afterAll(async () => {
    if (ds?.isInitialized) {
      for (const schema of schemaNames) {
        await ds.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      }
      if (schoolIds.length) {
        await ds.query(
          `DELETE FROM public.tenant_directory WHERE "schoolId" = ANY($1::uuid[])`,
          [schoolIds],
        );
        await ds.query(`DELETE FROM public.school WHERE id = ANY($1::uuid[])`, [
          schoolIds,
        ]);
      }
      await ds.destroy();
    }
  });

  it('proves tenant DDL lifecycle: existing vs new tenants vs platform migrations', async () => {
    const migrationCountBefore: Array<{ count: string }> = await ds.query(
      `SELECT COUNT(*)::text AS count FROM public.migrations`,
    );
    const platformMigrations: Array<{ name: string }> = await ds.query(
      `SELECT name FROM public.migrations ORDER BY id`,
    );

    // --- Existing tenants A and B (provisioned at T0) ---
    const tenantA = await provision('A');
    const tenantB = await provision('B');

    const studentColsA0 = await columnNames(tenantA.schema, 'student');
    const studentColsB0 = await columnNames(tenantB.schema, 'student');
    expect(studentColsA0).toEqual(studentColsB0);
    expect(studentColsA0.length).toBeGreaterThan(5);

    const tenantTableCount = collectTenantMetadatas(ds).length;
    expect(tenantTableCount).toBeGreaterThan(10);

    // --- Simulate "developer shipped new tenant DDL" without changing entities ---
    // 1) New COLUMN on student (as if @Column added to Student entity)
    await ds.query(
      `ALTER TABLE "${tenantA.schema}".student ADD COLUMN IF NOT EXISTS lifecycle_probe_col varchar`,
    );
    // 2) New TABLE (as if new @Entity added to TENANT_ENTITIES)
    await ds.query(
      `CREATE TABLE IF NOT EXISTS "${tenantA.schema}".lifecycle_probe_table (
         id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
         note varchar NOT NULL
       )`,
    );

    const studentColsAAfterManual = await columnNames(tenantA.schema, 'student');
    const studentColsBAfterManual = await columnNames(tenantB.schema, 'student');
    expect(studentColsAAfterManual).toContain('lifecycle_probe_col');
    expect(studentColsBAfterManual).not.toContain('lifecycle_probe_col');
    expect(await tableExists(tenantA.schema, 'lifecycle_probe_table')).toBe(true);
    expect(await tableExists(tenantB.schema, 'lifecycle_probe_table')).toBe(
      false,
    );

    // --- Re-run applyTenantSchemaTables (provisioner DDL path) on A and B ---
    // Models redeploy where provisioner DDL is NOT re-run on existing schools;
    // this tests whether createTable(ifNotExists) would heal schema drift.
    for (const schema of [tenantA.schema, tenantB.schema]) {
      const qr = ds.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        await applyTenantSchemaTables(qr, ds, schema);
        await qr.commitTransaction();
      } finally {
        await qr.release();
      }
    }

    const studentColsAAfterReapply = await columnNames(tenantA.schema, 'student');
    const studentColsBAfterReapply = await columnNames(tenantB.schema, 'student');
    // A keeps manual column; B still lacks it — reapply did NOT sync entity metadata
    expect(studentColsAAfterReapply).toContain('lifecycle_probe_col');
    expect(studentColsBAfterReapply).not.toContain('lifecycle_probe_col');
    expect(await tableExists(tenantB.schema, 'lifecycle_probe_table')).toBe(
      false,
    );

    // --- Platform migration path (public only) ---
    const qr = ds.createQueryRunner();
    await qr.connect();
    try {
      await applyPlatformTables(qr);
    } finally {
      await qr.release();
    }

    const studentColsAAfterPlatform = await columnNames(tenantA.schema, 'student');
    expect(studentColsAAfterPlatform).toContain('lifecycle_probe_col');
    expect(studentColsBAfterReapply).toEqual(studentColsB0);

    // --- New tenant C provisioned AFTER simulated DDL change ---
    const tenantC = await provision('C');
    const studentColsC = await columnNames(tenantC.schema, 'student');
    const studentColsAWithoutProbe = studentColsAAfterManual.filter(
      (c) => c !== 'lifecycle_probe_col',
    );

    // C matches current ENTITY metadata (same as A/B at T0), NOT the manual probe column/table
    expect(studentColsC).toEqual(studentColsB0);
    expect(studentColsC).toEqual(studentColsAWithoutProbe);
    expect(studentColsC).not.toContain('lifecycle_probe_col');
    expect(await tableExists(tenantC.schema, 'lifecycle_probe_table')).toBe(
      false,
    );

    // --- Per-tenant migration history ---
    const tenantMigrationTableA: Array<{ reg: string | null }> = await ds.query(
      `SELECT to_regclass($1) AS reg`,
      [`"${tenantA.schema}".migrations`],
    );
    const tenantMigrationTablePublic: Array<{ reg: string | null }> =
      await ds.query(`SELECT to_regclass('public.migrations') AS reg`);

    expect(tenantMigrationTablePublic[0].reg).not.toBeNull();
    expect(tenantMigrationTableA[0].reg).toBeNull();

    const migrationCountAfter: Array<{ count: string }> = await ds.query(
      `SELECT COUNT(*)::text AS count FROM public.migrations`,
    );
    expect(migrationCountAfter[0].count).toBe(migrationCountBefore[0].count);

    // Evidence object for console (visible in jest output)
    console.log(
      JSON.stringify(
        {
          probe: 'tenant-schema-lifecycle',
          runId,
          tenantEntityTableCount: tenantTableCount,
          platformMigrationNames: platformMigrations.map((m) => m.name),
          studentColumnCountBaseline: studentColsB0.length,
          tenantA_hasManualProbeColumn: studentColsAAfterReapply.includes(
            'lifecycle_probe_col',
          ),
          tenantB_hasManualProbeColumn: studentColsBAfterReapply.includes(
            'lifecycle_probe_col',
          ),
          tenantC_hasManualProbeColumn: studentColsC.includes(
            'lifecycle_probe_col',
          ),
          tenantC_matchesBaseline: studentColsC.every((c) =>
            studentColsB0.includes(c),
          ),
          perTenantMigrationsTableExists: false,
          publicMigrationsOnly: true,
        },
        null,
        2,
      ),
    );
  });
});
