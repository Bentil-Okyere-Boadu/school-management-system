import { DataSource, QueryRunner, Table } from 'typeorm';
import { assertTenantSchemaName } from './tenant-schema.util';
import {
  collectPlatformMetadatas,
  collectTenantMetadatas,
  collectTenantTableNames,
} from './tenant-metadata';
import {
  LEGACY_PUBLIC_TENANT_TABLES,
  PLATFORM_PUBLIC_TABLES,
} from './legacy-public-tenant-tables';

function retargetForeignKeys(table: Table, schemaName: string): void {
  for (const fk of table.foreignKeys ?? []) {
    const ref = (fk.referencedTableName || '').replace(/"/g, '');
    const base = ref.includes('.') ? ref.split('.').pop()! : ref;
    if (base === 'school' || base === 'role') {
      fk.referencedSchema = 'public';
      fk.referencedTableName = base;
    } else {
      fk.referencedSchema = schemaName;
      fk.referencedTableName = base;
    }
  }
}

export async function applyPlatformTables(queryRunner: QueryRunner): Promise<void> {
  const dataSource = queryRunner.connection;
  const tables: Table[] = [];
  for (const meta of collectPlatformMetadatas(dataSource)) {
    const table = Table.create(meta, dataSource.driver);
    table.schema = 'public';
    tables.push(table);
  }
  for (const table of tables) {
    const foreignKeys = [...(table.foreignKeys ?? [])];
    table.foreignKeys = [];
    await queryRunner.createTable(table, true, false, true);
    table.foreignKeys = foreignKeys;
  }
  for (const table of tables) {
    await createForeignKeysIdempotent(queryRunner, table);
  }
}

export async function applyTenantSchemaTables(
  queryRunner: QueryRunner,
  dataSource: DataSource,
  schemaName: string,
): Promise<void> {
  const tables: Table[] = [];
  for (const meta of collectTenantMetadatas(dataSource)) {
    const table = Table.create(meta, dataSource.driver);
    table.schema = schemaName;
    retargetForeignKeys(table, schemaName);
    tables.push(table);
  }

  for (const table of tables) {
    const foreignKeys = [...(table.foreignKeys ?? [])];
    table.foreignKeys = [];
    await queryRunner.createTable(table, true, false, true);
    table.foreignKeys = foreignKeys;
  }

  for (const table of tables) {
    await createForeignKeysIdempotent(queryRunner, table);
  }
}

function resolveConstraintSchema(schemaName: string): string {
  if (schemaName === 'public') {
    return 'public';
  }
  return assertTenantSchemaName(schemaName);
}

export async function foreignKeyExists(
  queryRunner: QueryRunner,
  schemaName: string,
  constraintName: string,
): Promise<boolean> {
  const schema = resolveConstraintSchema(schemaName);
  const rows: Array<{ exists: boolean }> = await queryRunner.query(
    `SELECT EXISTS (
       SELECT 1
       FROM pg_constraint c
       INNER JOIN pg_namespace n ON n.oid = c.connamespace
       WHERE n.nspname = $1
         AND c.conname = $2
         AND c.contype = 'f'
     ) AS exists`,
    [schema, constraintName],
  );
  return rows[0]?.exists === true;
}

export async function createForeignKeysIdempotent(
  queryRunner: QueryRunner,
  table: Table,
): Promise<void> {
  const schemaName = table.schema;
  if (!schemaName || !table.foreignKeys?.length) {
    return;
  }

  for (const fk of table.foreignKeys) {
    const name = fk.name;
    if (!name) {
      await queryRunner.createForeignKeys(table, [fk]);
      continue;
    }
    if (!(await foreignKeyExists(queryRunner, schemaName, name))) {
      await queryRunner.createForeignKeys(table, [fk]);
    }
  }
}

const PLATFORM_NAMES = new Set(PLATFORM_PUBLIC_TABLES);

function assertSafePgTableName(name: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Refusing to drop unsafe table identifier: ${name}`);
  }
  if (PLATFORM_NAMES.has(name)) {
    throw new Error(`Refusing to drop platform catalog table: ${name}`);
  }
  return name;
}

async function assertSafeToDropPublicTable(
  queryRunner: QueryRunner,
  tableName: string,
): Promise<void> {
  if (process.env.ALLOW_PUBLIC_TENANT_TABLE_DROP === 'true') {
    return;
  }
  const safeName = assertSafePgTableName(tableName);
  const rows: Array<{ count: string }> = await queryRunner.query(
    `SELECT COUNT(*)::text AS count FROM public."${safeName}"`,
  );
  const count = parseInt(rows[0]?.count ?? '0', 10);
  if (count > 0) {
    throw new Error(
      `Refusing to drop public."${safeName}" (${count} rows). ` +
        'Set ALLOW_PUBLIC_TENANT_TABLE_DROP=true to override.',
    );
  }
}

async function dropPublicTable(
  queryRunner: QueryRunner,
  tableName: string,
): Promise<void> {
  const name = assertSafePgTableName(tableName);
  const exists: Array<{ regclass: string | null }> = await queryRunner.query(
    `SELECT to_regclass('public."${name}"') AS regclass`,
  );
  if (!exists[0]?.regclass) {
    return;
  }
  await assertSafeToDropPublicTable(queryRunner, name);
  await queryRunner.query(`DROP TABLE IF EXISTS public."${name}" CASCADE`);
}

export async function dropPublicTenantTables(
  queryRunner: QueryRunner,
  dataSource: DataSource,
): Promise<void> {
  const names = new Set<string>([
    ...collectTenantTableNames(dataSource),
    ...LEGACY_PUBLIC_TENANT_TABLES,
  ]);
  for (const name of names) {
    await dropPublicTable(queryRunner, name);
  }

  const leftoverPublic: Array<{ tablename: string }> = await queryRunner.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  for (const row of leftoverPublic) {
    if (names.has(row.tablename)) {
      await dropPublicTable(queryRunner, row.tablename);
    }
  }
}
