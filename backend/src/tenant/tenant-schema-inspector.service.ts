import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner, Table } from 'typeorm';
import { collectTenantMetadatas } from './tenant-metadata';
import { TENANT_SCHEMA_HEAD } from './tenant-schema-version';
import { assertTenantSchemaName } from './tenant-schema.util';

/** table -> sorted "column:normalizedType" entries */
export type SchemaFingerprint = Map<string, string[]>;

@Injectable()
export class TenantSchemaInspector {
  constructor(private readonly dataSource: DataSource) {}

  buildExpectedFingerprint(): SchemaFingerprint {
    const fingerprint: SchemaFingerprint = new Map();

    for (const meta of collectTenantMetadatas(this.dataSource)) {
      const table = Table.create(meta, this.dataSource.driver);
      const columns = table.columns
        .map((col) => {
          const type = this.normalizeTableColumnType(col.type, col.length);
          return `${col.name}:${type}`;
        })
        .sort();
      fingerprint.set(table.name, columns);
    }

    return fingerprint;
  }

  async buildActualFingerprint(
    queryRunner: QueryRunner,
    schemaName: string,
  ): Promise<SchemaFingerprint> {
    const schema = assertTenantSchemaName(schemaName);
    const expectedTables = [...this.buildExpectedFingerprint().keys()].sort();
    const fingerprint: SchemaFingerprint = new Map();

    for (const tableName of expectedTables) {
      const existsRows: Array<{ reg: string | null }> = await queryRunner.query(
        `SELECT to_regclass($1) AS reg`,
        [`"${schema}"."${tableName}"`],
      );
      if (!existsRows[0]?.reg) {
        fingerprint.set(tableName, []);
        continue;
      }

      const rows: Array<{ column_name: string; data_type: string; udt_name: string }> =
        await queryRunner.query(
          `SELECT column_name, data_type, udt_name
           FROM information_schema.columns
           WHERE table_schema = $1 AND table_name = $2
           ORDER BY ordinal_position`,
          [schema, tableName],
        );

      const columns = rows
        .map((row) => {
          const type = this.normalizeActualType(row.data_type, row.udt_name);
          return `${row.column_name}:${type}`;
        })
        .sort();
      fingerprint.set(tableName, columns);
    }

    return fingerprint;
  }

  compareFingerprints(
    expected: SchemaFingerprint,
    actual: SchemaFingerprint,
  ): string[] {
    const diffs: string[] = [];
    const tables = new Set([...expected.keys(), ...actual.keys()]);

    for (const table of [...tables].sort()) {
      const expCols = expected.get(table) ?? [];
      const actCols = actual.get(table) ?? [];

      if (actCols.length === 0 && expCols.length > 0) {
        diffs.push(`missing table ${table}`);
        continue;
      }

      const expSet = new Set(expCols.map((c) => c.split(':')[0]));
      for (const col of expCols) {
        const [name, expType] = col.split(':');
        const actualMatch = actCols.find((c) => c.startsWith(`${name}:`));
        if (!actualMatch) {
          diffs.push(`${table}: missing column ${col}`);
        } else {
          const actType = actualMatch.split(':')[1];
          if (!this.typesCompatible(expType, actType)) {
            diffs.push(
              `${table}: column type mismatch expected ${col} got ${actualMatch}`,
            );
          }
        }
      }

      for (const col of actCols) {
        const [name] = col.split(':');
        if (!expSet.has(name)) {
          diffs.push(`${table}: unexpected column ${col}`);
        }
      }
    }

    return diffs;
  }

  async assertSchemaMatchesHead(
    queryRunner: QueryRunner,
    schemaName: string,
    head: number = TENANT_SCHEMA_HEAD,
  ): Promise<void> {
    if (head !== TENANT_SCHEMA_HEAD) {
      throw new Error(
        `assertSchemaMatchesHead supports production HEAD ${TENANT_SCHEMA_HEAD} only (got ${head})`,
      );
    }
    const expected = this.buildExpectedFingerprint();
    const actual = await this.buildActualFingerprint(queryRunner, schemaName);
    const diffs = this.compareFingerprints(expected, actual);
    if (diffs.length) {
      throw new Error(
        `Tenant schema does not match HEAD ${head}: ${diffs.slice(0, 5).join('; ')}${diffs.length > 5 ? ` (+${diffs.length - 5} more)` : ''}`,
      );
    }
  }

  assertFingerprintsEqual(a: SchemaFingerprint, b: SchemaFingerprint): void {
    const diffs = this.compareFingerprints(a, b);
    if (diffs.length) {
      throw new Error(
        `Schema fingerprints differ: ${diffs.slice(0, 5).join('; ')}${diffs.length > 5 ? ` (+${diffs.length - 5} more)` : ''}`,
      );
    }
  }

  private normalizeTableColumnType(type: string, length?: string): string {
    const lower = (type || '').toLowerCase();
    if (lower === 'varchar' || lower === 'character varying') {
      return 'varchar';
    }
    if (lower === 'int' || lower === 'integer' || lower === 'int4') {
      return 'int4';
    }
    if (lower === 'bigint' || lower === 'int8') return 'int8';
    if (lower === 'boolean' || lower === 'bool') return 'bool';
    if (lower === 'timestamptz' || lower === 'timestamp with time zone') {
      return 'timestamptz';
    }
    if (
      lower === 'timestamp' ||
      lower === 'timestamp without time zone' ||
      lower === 'datetime'
    ) {
      return 'timestamp';
    }
    if (lower === 'uuid') return 'uuid';
    if (lower === 'float' || lower === 'float8' || lower === 'double precision') {
      return 'float8';
    }
    if (lower === 'text') return 'text';
    if (lower === 'jsonb') return 'jsonb';
    if (lower === 'simple-array') return 'text';
    if (lower === 'enum') return 'enum';
    return lower;
  }

  private typesCompatible(expected: string, actual: string): boolean {
    const exp = expected.toLowerCase();
    const act = actual.toLowerCase();
    if (exp === act) return true;
    if (exp === 'varchar' && act === 'varchar') return true;
    if (exp === 'text' && (act === 'text' || act === 'varchar')) return true;
    if (exp === 'int4' && (act === 'int4' || act === 'integer')) return true;
    if (exp === 'float8' && (act === 'float8' || act === 'float4')) {
      return true;
    }
    if (
      (exp === 'timestamp' || exp === 'timestamptz') &&
      (act === 'timestamp' ||
        act === 'timestamptz' ||
        act === 'timestamp without time zone' ||
        act === 'timestamp with time zone')
    ) {
      return true;
    }
    if (exp === 'enum' && (act === 'enum' || act.endsWith('_enum'))) {
      return true;
    }
    return false;
  }

  private normalizeActualType(dataType: string, udtName: string): string {
    const dt = dataType.toLowerCase();
    const udt = udtName.toLowerCase();
    if (dt === 'character varying' || udt === 'varchar') return 'varchar';
    if (dt === 'integer' || udt === 'int4') return 'int4';
    if (dt === 'bigint' || udt === 'int8') return 'int8';
    if (dt === 'boolean' || udt === 'bool') return 'bool';
    if (dt === 'timestamp with time zone' || udt === 'timestamptz') {
      return 'timestamptz';
    }
    if (dt === 'timestamp without time zone' || dt === 'timestamp' || udt === 'timestamp') {
      return 'timestamp';
    }
    if (dt === 'uuid' || udt === 'uuid') return 'uuid';
    if (dt === 'double precision' || udt === 'float8') return 'float8';
    if (dt === 'real' || udt === 'float4') return 'float4';
    if (dt === 'text' || udt === 'text') return 'text';
    if (dt === 'jsonb' || udt === 'jsonb') return 'jsonb';
    if (dt === 'numeric' || udt === 'numeric') return 'numeric';
    if (dt === 'user-defined' && udt.endsWith('_enum')) return 'enum';
    return udt || dt;
  }
}
