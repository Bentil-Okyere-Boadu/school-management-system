import { MigrationInterface, QueryRunner } from 'typeorm';
import { dropPublicTenantTables } from '../tenant/tenant-ddl';

/**
 * Re-runs the public tenant-table drop after the Phase 4 allowlist audit.
 * Intentionally reasserts migration 0002/0003 via the shared helper.
 * Idempotent: DROP IF EXISTS. Public must not hold operational tenant tables.
 */
export class ReassertDropPublicTenantTables1700000000004
  implements MigrationInterface
{
  name = 'ReassertDropPublicTenantTables1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await dropPublicTenantTables(queryRunner, queryRunner.connection);
  }

  public async down(): Promise<void> {
    // Intentionally empty: public must not hold tenant operational tables.
  }
}
