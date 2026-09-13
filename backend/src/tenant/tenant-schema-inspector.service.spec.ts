import { SchemaFingerprint } from './tenant-schema-inspector.service';
import { TenantSchemaInspector } from './tenant-schema-inspector.service';
import { DataSource } from 'typeorm';

describe('TenantSchemaInspector', () => {
  it('reports no diffs when fingerprints are equal', () => {
    const ds = {} as DataSource;
    const inspector = new TenantSchemaInspector(ds);
    const fp: SchemaFingerprint = new Map([
      ['student', ['id:uuid', 'email:varchar']],
    ]);
    expect(() => inspector.assertFingerprintsEqual(fp, fp)).not.toThrow();
  });

  it('reports column mismatch', () => {
    const ds = {} as DataSource;
    const inspector = new TenantSchemaInspector(ds);
    const expected: SchemaFingerprint = new Map([
      ['student', ['id:uuid', 'email:varchar']],
    ]);
    const actual: SchemaFingerprint = new Map([
      ['student', ['id:uuid']],
    ]);
    const diffs = inspector.compareFingerprints(expected, actual);
    expect(diffs.some((d) => d.includes('missing column'))).toBe(true);
  });
});
