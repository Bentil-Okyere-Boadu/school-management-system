import {
  assertTenantSchemaName,
  quotePgIdent,
  tenantSchemaName,
} from './tenant-schema.util';

describe('tenantSchemaName', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000';

  it('builds tenant_<uuid> from a valid school id', () => {
    expect(tenantSchemaName(id)).toBe(`tenant_${id}`);
  });

  it('rejects non-uuid input so callers cannot inject schema names', () => {
    expect(() => tenantSchemaName('public')).toThrow(/Invalid school id/);
    expect(() => tenantSchemaName('tenant_abc; drop schema public')).toThrow(
      /Invalid school id/,
    );
    expect(() => tenantSchemaName('')).toThrow(/Invalid school id/);
  });

  it('round-trips assertTenantSchemaName', () => {
    expect(assertTenantSchemaName(tenantSchemaName(id))).toBe(`tenant_${id}`);
  });

  it('quotes identifiers for search_path', () => {
    expect(quotePgIdent(tenantSchemaName(id))).toBe(`"tenant_${id}"`);
  });
});
