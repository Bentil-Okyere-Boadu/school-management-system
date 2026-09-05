import { config } from 'dotenv';
import { DataSource, EntityManager } from 'typeorm';
import { School } from '../src/school/school.entity';
import { EventCategory } from '../src/planner/entities/event-category.entity';
import { TenantProvisionerService } from '../src/tenant/tenant-provisioner.service';
import { TenantSchemaInspector } from '../src/tenant/tenant-schema-inspector.service';
import { TenantResolverService } from '../src/tenant/tenant-resolver.service';
import { TenantConnectionService } from '../src/tenant/tenant-connection.service';
import { SchoolProvisioningStatus } from '../src/tenant/school-provisioning-status';
import { tenantSchemaName } from '../src/tenant/tenant-schema.util';
import { bootstrapTenantE2eDataSource } from './helpers/tenant-e2e-bootstrap';

config();

/**
 * Phase 2 gate: one pooled DataSource, two provisioned schools.
 * Tenant CRUD must use TenantConnectionService QueryRunner (SET LOCAL),
 * not DataSource.manager. Isolation + no search_path leak.
 */
describe('Phase 2 tenant routing (two schools)', () => {
  let ds: DataSource;
  let tenantConnection: TenantConnectionService;
  let schoolA: School;
  let schoolB: School;
  let schemaA: string;
  let schemaB: string;

  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'school_management',
  };

  function assertTenantBoundManager(
    manager: EntityManager,
    expectedSchema: string,
  ): void {
    expect(manager).not.toBe(ds.manager);
    expect(manager.queryRunner).toBeDefined();
    expect(tenantConnection.tryGetStore()?.manager).toBe(manager);
    expect(tenantConnection.tryGetStore()?.schemaName).toBe(expectedSchema);
  }

  async function currentSearchPath(
    manager: EntityManager,
  ): Promise<string> {
    const rows: Array<{ search_path: string }> = await manager.query(
      'SHOW search_path',
    );
    return rows[0]?.search_path ?? '';
  }

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres',
      ...dbConfig,
      entities: [__dirname + '/../src/**/*.entity.{ts,js}'],
      synchronize: false,
    });
    await ds.initialize();
    await bootstrapTenantE2eDataSource(ds);

    const resolver = new TenantResolverService(ds.getRepository(School));
    tenantConnection = new TenantConnectionService(ds, resolver);
    const provisioner = new TenantProvisionerService(
      ds,
      new TenantSchemaInspector(ds),
    );
    const schoolRepo = ds.getRepository(School);

    schoolA = await provisioner.provision(
      await schoolRepo.save(
        schoolRepo.create({
          name: `Phase2 A ${Date.now()}`,
          provisioningStatus: SchoolProvisioningStatus.Provisioning,
        }),
      ),
    );
    schoolB = await provisioner.provision(
      await schoolRepo.save(
        schoolRepo.create({
          name: `Phase2 B ${Date.now()}`,
          provisioningStatus: SchoolProvisioningStatus.Provisioning,
        }),
      ),
    );
    schemaA = tenantSchemaName(schoolA.id);
    schemaB = tenantSchemaName(schoolB.id);
    expect(schoolA.provisioningStatus).toBe(SchoolProvisioningStatus.Active);
    expect(schoolB.provisioningStatus).toBe(SchoolProvisioningStatus.Active);
    expect(schoolA.schemaName).toBe(schemaA);
    expect(schoolB.schemaName).toBe(schemaB);
  });

  afterAll(async () => {
    if (ds?.isInitialized) {
      if (schemaA) {
        await ds.query(`DROP SCHEMA IF EXISTS "${schemaA}" CASCADE`);
      }
      if (schemaB) {
        await ds.query(`DROP SCHEMA IF EXISTS "${schemaB}" CASCADE`);
      }
      const schoolRepo = ds.getRepository(School);
      if (schoolA?.id) {
        await schoolRepo.delete(schoolA.id);
      }
      if (schoolB?.id) {
        await schoolRepo.delete(schoolB.id);
      }
      await ds.destroy();
    }
  });

  it('resolves each school to its tenant schema', async () => {
    const resolver = new TenantResolverService(ds.getRepository(School));
    const a = await resolver.resolveBySchoolId(schoolA.id);
    const b = await resolver.resolveBySchoolId(schoolB.id);
    expect(a.schemaName).toBe(schemaA);
    expect(b.schemaName).toBe(schemaB);
    expect(a.schemaName).not.toBe(b.schemaName);
  });

  it('School A creates and reads only in tenant_A via QueryRunner', async () => {
    const marker = `phase2-a-${Date.now()}`;
    const saved = await tenantConnection.runForSchoolId(
      schoolA.id,
      async (manager) => {
        assertTenantBoundManager(manager, schemaA);
        const path = await currentSearchPath(manager);
        expect(path.toLowerCase()).toContain('tenant_');
        const row = manager.create(EventCategory, {
          name: marker,
          color: '#111111',
          description: 'phase2-a',
          school: schoolA,
        });
        return manager.save(EventCategory, row);
      },
    );
    expect(saved.id).toBeDefined();

    const inA: Array<{ cnt: string }> = await ds.query(
      `SELECT COUNT(*)::text AS cnt FROM "${schemaA}".event_category WHERE name = $1`,
      [marker],
    );
    const inB: Array<{ cnt: string }> = await ds.query(
      `SELECT COUNT(*)::text AS cnt FROM "${schemaB}".event_category WHERE name = $1`,
      [marker],
    );
    expect(Number(inA[0].cnt)).toBe(1);
    expect(Number(inB[0].cnt)).toBe(0);

    const found = await tenantConnection.runForSchoolId(
      schoolA.id,
      async (manager) => {
        assertTenantBoundManager(manager, schemaA);
        return manager.findOne(EventCategory, { where: { name: marker } });
      },
    );
    expect(found?.id).toBe(saved.id);
  });

  it('School B creates and reads only in tenant_B via QueryRunner', async () => {
    const marker = `phase2-b-${Date.now()}`;
    await tenantConnection.runForSchoolId(schoolB.id, async (manager) => {
      assertTenantBoundManager(manager, schemaB);
      await manager.save(
        EventCategory,
        manager.create(EventCategory, {
          name: marker,
          color: '#222222',
          description: 'phase2-b',
          school: schoolB,
        }),
      );
    });
    const inB: Array<{ cnt: string }> = await ds.query(
      `SELECT COUNT(*)::text AS cnt FROM "${schemaB}".event_category WHERE name = $1`,
      [marker],
    );
    const inA: Array<{ cnt: string }> = await ds.query(
      `SELECT COUNT(*)::text AS cnt FROM "${schemaA}".event_category WHERE name = $1`,
      [marker],
    );
    expect(Number(inB[0].cnt)).toBe(1);
    expect(Number(inA[0].cnt)).toBe(0);
  });

  it('cross-tenant: A cannot read/update/delete B rows; B cannot touch A', async () => {
    const nameA = `phase2-iso-a-${Date.now()}`;
    const nameB = `phase2-iso-b-${Date.now()}`;
    const rowA = await tenantConnection.runForSchoolId(schoolA.id, (m) =>
      m.save(
        EventCategory,
        m.create(EventCategory, {
          name: nameA,
          color: '#aaaaaa',
          school: schoolA,
        }),
      ),
    );
    const rowB = await tenantConnection.runForSchoolId(schoolB.id, (m) =>
      m.save(
        EventCategory,
        m.create(EventCategory, {
          name: nameB,
          color: '#bbbbbb',
          school: schoolB,
        }),
      ),
    );

    const aSeesB = await tenantConnection.runForSchoolId(schoolA.id, (m) =>
      m.findOne(EventCategory, { where: { id: rowB.id } }),
    );
    const bSeesA = await tenantConnection.runForSchoolId(schoolB.id, (m) =>
      m.findOne(EventCategory, { where: { id: rowA.id } }),
    );
    expect(aSeesB).toBeNull();
    expect(bSeesA).toBeNull();

    await tenantConnection.runForSchoolId(schoolA.id, async (m) => {
      await m.update(EventCategory, rowB.id, { name: 'hacked-by-a' });
      await m.delete(EventCategory, rowB.id);
    });
    await tenantConnection.runForSchoolId(schoolB.id, async (m) => {
      await m.update(EventCategory, rowA.id, { name: 'hacked-by-b' });
      await m.delete(EventCategory, rowA.id);
    });

    const stillA: Array<{ name: string }> = await ds.query(
      `SELECT name FROM "${schemaA}".event_category WHERE id = $1`,
      [rowA.id],
    );
    const stillB: Array<{ name: string }> = await ds.query(
      `SELECT name FROM "${schemaB}".event_category WHERE id = $1`,
      [rowB.id],
    );
    expect(stillA[0]?.name).toBe(nameA);
    expect(stillB[0]?.name).toBe(nameB);
  });

  it('sequential A then B on the same pool does not leak search_path', async () => {
    const markerA = `phase2-seq-a-${Date.now()}`;
    await tenantConnection.runForSchoolId(schoolA.id, async (manager) => {
      assertTenantBoundManager(manager, schemaA);
      await manager.save(
        EventCategory,
        manager.create(EventCategory, {
          name: markerA,
          color: '#333333',
          school: schoolA,
        }),
      );
    });

    const leakQr = ds.createQueryRunner();
    await leakQr.connect();
    try {
      const shown: Array<{ search_path: string }> = await leakQr.query(
        'SHOW search_path',
      );
      const path = shown[0]?.search_path ?? '';
      expect(path.includes(schemaA)).toBe(false);
    } finally {
      await leakQr.release();
    }

    const bList = await tenantConnection.runForSchoolId(schoolB.id, async (m) => {
      assertTenantBoundManager(m, schemaB);
      return m.find(EventCategory, { where: { name: markerA } });
    });
    expect(bList).toHaveLength(0);
  });

  it('concurrent A and B do not cross rows', async () => {
    const markerA = `phase2-par-a-${Date.now()}`;
    const markerB = `phase2-par-b-${Date.now()}`;
    await Promise.all([
      tenantConnection.runForSchoolId(schoolA.id, async (m) => {
        assertTenantBoundManager(m, schemaA);
        await m.save(
          EventCategory,
          m.create(EventCategory, {
            name: markerA,
            color: '#444444',
            school: schoolA,
          }),
        );
      }),
      tenantConnection.runForSchoolId(schoolB.id, async (m) => {
        assertTenantBoundManager(m, schemaB);
        await m.save(
          EventCategory,
          m.create(EventCategory, {
            name: markerB,
            color: '#555555',
            school: schoolB,
          }),
        );
      }),
    ]);
    const [aHasB, bHasA] = await Promise.all([
      tenantConnection.runForSchoolId(schoolA.id, (m) =>
        m.find(EventCategory, { where: { name: markerB } }),
      ),
      tenantConnection.runForSchoolId(schoolB.id, (m) =>
        m.find(EventCategory, { where: { name: markerA } }),
      ),
    ]);
    expect(aHasB).toHaveLength(0);
    expect(bHasA).toHaveLength(0);
    expect(tenantConnection.tryGetStore()).toBeUndefined();
  });

  it('default DataSource.manager is not the tenant QueryRunner manager', async () => {
    expect(ds.manager.queryRunner).toBeUndefined();
    await tenantConnection.runForSchoolId(schoolA.id, async (manager) => {
      expect(manager).not.toBe(ds.manager);
      expect(manager.queryRunner).toBeDefined();
      expect(manager.queryRunner?.isTransactionActive).toBe(true);
    });
  });
});
