import { loadRegistry, stepsForRange } from './tenant-migration-registry';
import { TenantMigrationStep } from './tenant-migration.types';

describe('tenant-migration-registry', () => {
  it('loads production registry in deterministic version order', () => {
    const steps = loadRegistry();
    expect(steps.length).toBeGreaterThan(0);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].version).toBeGreaterThan(steps[i - 1].version);
    }
  });

  it('rejects duplicate versions', () => {
    const dup: TenantMigrationStep[] = [
      { version: 1, name: 'a', up: async () => {} },
      { version: 1, name: 'b', up: async () => {} },
    ];
    expect(() => loadRegistry(dup)).toThrow(/Duplicate tenant migration version 1/);
  });

  it('returns pending steps for a version range', () => {
    const steps: TenantMigrationStep[] = [
      { version: 0, name: 'baseline', up: async () => {} },
      { version: 901, name: 'col', up: async () => {} },
      { version: 902, name: 'table', up: async () => {} },
    ];
    expect(stepsForRange(steps, 0, 902)).toEqual([
      steps[1],
      steps[2],
    ]);
    expect(stepsForRange(steps, 901, 902)).toEqual([steps[2]]);
    expect(stepsForRange(steps, 902, 902)).toEqual([]);
  });
});
