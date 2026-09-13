import {
  LEGACY_PUBLIC_TENANT_TABLES,
  PLATFORM_PUBLIC_TABLES,
} from './legacy-public-tenant-tables';

describe('legacy public tenant tables', () => {
  it('does not overlap the platform catalog allowlist', () => {
    const platform = new Set(PLATFORM_PUBLIC_TABLES);
    for (const name of LEGACY_PUBLIC_TENANT_TABLES) {
      expect(platform.has(name)).toBe(false);
    }
  });

  it('only uses safe SQL identifiers', () => {
    for (const name of LEGACY_PUBLIC_TENANT_TABLES) {
      expect(name).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
    }
  });
});
