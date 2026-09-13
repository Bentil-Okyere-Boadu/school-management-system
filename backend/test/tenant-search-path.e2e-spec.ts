import { randomUUID } from 'crypto';
import { config } from 'dotenv';
import { DataSource, QueryRunner, Table, TableForeignKey } from 'typeorm';
import {
  CatalogSchoolProof,
  TenantStudentProof,
} from '../src/tenant/tenant-search-path.proof.entities';
import {
  quotePgIdent,
  tenantSchemaName,
} from '../src/tenant/tenant-schema.util';

/**
 * Phase 0a hard gate: TypeORM + PostgreSQL search_path, not mocks.
 * One DataSource. School only in public. Student table in tenant schema
 * with FK to public.school. SET LOCAL for queries.
 */
config();

describe('TypeORM tenant search_path proof (Phase 0a)', () => {
  const schoolAId = randomUUID();
  const schoolBId = randomUUID();
  const schemaA = tenantSchemaName(schoolAId);
  const schemaB = tenantSchemaName(schoolBId);

  let ds: DataSource;
  const sqlLog: string[] = [];

  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'school_management',
  };

  async function withTenantPath<T>(
    schema: string,
    fn: (qr: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const qr = ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.query(
        `SET LOCAL search_path TO ${quotePgIdent(schema)}, public`,
      );
      const result = await fn(qr);
      await qr.commitTransaction();
      return result;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async function createTenantStudentTable(schema: string): Promise<void> {
    const qr = ds.createQueryRunner();
    await qr.connect();
    try {
      await qr.query(`CREATE SCHEMA IF NOT EXISTS ${quotePgIdent(schema)}`);
      await qr.createTable(
        new Table({
          name: 'student',
          schema,
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            { name: 'email', type: 'varchar', isNullable: false },
            { name: 'schoolId', type: 'uuid', isNullable: false },
          ],
        }),
        true,
      );
      await qr.createForeignKey(
        `${schema}.student`,
        new TableForeignKey({
          columnNames: ['schoolId'],
          referencedTableName: 'school',
          referencedSchema: 'public',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    } finally {
      await qr.release();
    }
  }

  beforeAll(async () => {
    ds = new DataSource({
      type: 'postgres',
      ...dbConfig,
      entities: [CatalogSchoolProof, TenantStudentProof],
      synchronize: false,
      logging: true,
      logger: 'advanced-console',
      maxQueryExecutionTime: 5000,
    });

    const original = console.log.bind(console);
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      const line = args.map(String).join(' ');
      sqlLog.push(line);
      original(...args);
    });

    try {
      await ds.initialize();
    } catch (err) {
      throw new Error(
        `Phase 0a requires Postgres at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}. ${String(err)}`,
      );
    }

    await ds.query(`DROP SCHEMA IF EXISTS ${quotePgIdent(schemaA)} CASCADE`);
    await ds.query(`DROP SCHEMA IF EXISTS ${quotePgIdent(schemaB)} CASCADE`);
    await ds.query(
      `CREATE TABLE IF NOT EXISTS public.school (
        id uuid PRIMARY KEY,
        name varchar NOT NULL
      )`,
    );
    await ds.query(`DELETE FROM public.school WHERE id IN ($1, $2)`, [
      schoolAId,
      schoolBId,
    ]);
    await ds.query(`INSERT INTO public.school (id, name) VALUES ($1, $2)`, [
      schoolAId,
      'School A',
    ]);
    await ds.query(`INSERT INTO public.school (id, name) VALUES ($1, $2)`, [
      schoolBId,
      'School B',
    ]);

    await createTenantStudentTable(schemaA);
    await createTenantStudentTable(schemaB);
  }, 30000);

  afterAll(async () => {
    if (ds?.isInitialized) {
      await ds.query(`DROP SCHEMA IF EXISTS ${quotePgIdent(schemaA)} CASCADE`);
      await ds.query(`DROP SCHEMA IF EXISTS ${quotePgIdent(schemaB)} CASCADE`);
      await ds.query(`DELETE FROM public.school WHERE id IN ($1, $2)`, [
        schoolAId,
        schoolBId,
      ]);
      await ds.destroy();
    }
    jest.restoreAllMocks();
  });

  it('creates a real FK from tenant.student to public.school', async () => {
    const rows: Array<{
      table_schema: string;
      table_name: string;
      foreign_table_schema: string;
      foreign_table_name: string;
    }> = await ds.query(
      `
      SELECT
        tc.table_schema,
        tc.table_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.constraint_schema = ccu.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = 'student'
      `,
      [schemaA],
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].foreign_table_schema).toBe('public');
    expect(rows[0].foreign_table_name).toBe('school');
    expect(rows[0].table_schema).toBe(schemaA);
  });

  it('TypeORM save/find with relations hydrates public.school under SET LOCAL search_path', async () => {
    const studentId = await withTenantPath(schemaA, async (qr) => {
      const school = await qr.manager.findOneByOrFail(CatalogSchoolProof, {
        id: schoolAId,
      });
      const saved = await qr.manager.save(
        qr.manager.create(TenantStudentProof, {
          email: 'a-student@example.com',
          school,
        }),
      );
      const loaded = await qr.manager.findOneOrFail(TenantStudentProof, {
        where: { id: saved.id },
        relations: ['school'],
      });
      expect(loaded.school.id).toBe(schoolAId);
      expect(loaded.school.name).toBe('School A');
      return saved.id;
    });

    const joinSql = sqlLog.filter(
      (line) =>
        /SELECT/i.test(line) &&
        /student/i.test(line) &&
        /school/i.test(line),
    );
    expect(joinSql.length).toBeGreaterThan(0);
    const combined = joinSql.join('\n');
    expect(combined).toMatch(/"student"/i);
    expect(combined).toMatch(/"school"/i);
    expect(combined).not.toMatch(/tenant_[0-9a-f-]+\.school/i);

    expect(studentId).toBeDefined();
  });

  it('does not leak rows across tenant schemas', async () => {
    await withTenantPath(schemaB, async (qr) => {
      const school = await qr.manager.findOneByOrFail(CatalogSchoolProof, {
        id: schoolBId,
      });
      await qr.manager.save(
        qr.manager.create(TenantStudentProof, {
          email: 'b-student@example.com',
          school,
        }),
      );
      const students = await qr.manager.find(TenantStudentProof);
      expect(students.map((s) => s.email)).toEqual(['b-student@example.com']);
      expect(students.map((s) => s.email)).not.toContain(
        'a-student@example.com',
      );
    });

    await withTenantPath(schemaA, async (qr) => {
      const students = await qr.manager.find(TenantStudentProof);
      expect(students.map((s) => s.email)).toEqual(['a-student@example.com']);
    });
  });

  it('does not leak search_path onto the next pooled connection', async () => {
    await withTenantPath(schemaA, async () => undefined);

    const qr = ds.createQueryRunner();
    await qr.connect();
    try {
      const [{ search_path }] = await qr.query(`SHOW search_path`);
      expect(String(search_path)).not.toContain(schemaA);
      expect(String(search_path)).not.toContain(schemaB);
      expect(String(search_path)).not.toMatch(/tenant_/i);
    } finally {
      await qr.release();
    }
  });
});
