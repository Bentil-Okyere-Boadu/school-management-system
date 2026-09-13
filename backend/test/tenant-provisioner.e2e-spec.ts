import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { School } from '../src/school/school.entity';
import { TenantProvisionerService } from '../src/tenant/tenant-provisioner.service';
import { TenantSchemaInspector } from '../src/tenant/tenant-schema-inspector.service';
import { TENANT_SCHEMA_HEAD } from '../src/tenant/tenant-schema-version';
import { SchoolProvisioningStatus } from '../src/tenant/school-provisioning-status';
import { tenantSchemaName } from '../src/tenant/tenant-schema.util';
import { bootstrapTenantE2eDataSource } from './helpers/tenant-e2e-bootstrap';

config();

describe('Tenant provisioner (Phase 1)', () => {
  let ds: DataSource;
  let provisioner: TenantProvisionerService;

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'school_management',
      entities: [__dirname + '/../src/**/*.entity.{ts,js}'],
      synchronize: false,
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
      await ds.destroy();
    }
  });

  it('creates tenant schema, tables, seeds, and marks ACTIVE', async () => {
    const schoolRepo = ds.getRepository(School);
    const school = await schoolRepo.save(
      schoolRepo.create({
        name: `Provision proof ${Date.now()}`,
        provisioningStatus: SchoolProvisioningStatus.Provisioning,
      }),
    );
    const schema = tenantSchemaName(school.id);
    const provisioned = await provisioner.provision(school);
    expect(provisioned.provisioningStatus).toBe(SchoolProvisioningStatus.Active);
    expect(provisioned.schemaName).toBe(schema);
    expect(provisioned.tenantSchemaVersion).toBe(TENANT_SCHEMA_HEAD);
    expect(provisioned.tenantMigrationStatus).toBe('ok');

    const schemas: Array<{ nspname: string }> = await ds.query(
      `SELECT nspname FROM pg_namespace WHERE nspname = $1`,
      [schema],
    );
    expect(schemas.length).toBe(1);

    const tables: Array<{ table_name: string }> = await ds.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1`,
      [schema],
    );
    const names = tables.map((t) => t.table_name);
    expect(names).toEqual(expect.arrayContaining(['student', 'school_admin', 'profile']));
    expect(names).not.toContain('school');
    expect(names).not.toContain('role');

    await ds.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await schoolRepo.delete(school.id);
  });
});
