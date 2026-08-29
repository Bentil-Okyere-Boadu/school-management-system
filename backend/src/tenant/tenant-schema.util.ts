const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Canonical tenant schema name: tenant_<uuid> (hyphens kept).
 * Always quote this identifier in SQL. Never build it from request input
 * other than a validated school UUID from the platform catalog.
 */
export function tenantSchemaName(schoolId: string): string {
  const id = schoolId?.trim();
  if (!id || !UUID_RE.test(id)) {
    throw new Error('Invalid school id for tenant schema');
  }
  return `tenant_${id.toLowerCase()}`;
}

export function assertTenantSchemaName(schemaName: string): string {
  const name = schemaName?.trim().toLowerCase();
  if (!name?.startsWith('tenant_')) {
    throw new Error('Invalid tenant schema name');
  }
  const uuid = name.slice('tenant_'.length);
  if (!UUID_RE.test(uuid)) {
    throw new Error('Invalid tenant schema name');
  }
  return name;
}

export function quotePgIdent(ident: string): string {
  if (!/^[a-z0-9_]+$/i.test(ident) && !/^tenant_[0-9a-f-]+$/.test(ident)) {
    throw new Error('Refusing to quote unsafe SQL identifier');
  }
  return `"${ident.replace(/"/g, '""')}"`;
}
