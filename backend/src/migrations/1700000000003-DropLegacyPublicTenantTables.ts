import { MigrationInterface, QueryRunner } from 'typeorm';
import { dropPublicTenantTables } from '../tenant/tenant-ddl';

/**
 * Drops leftover public copies of tenant tables whose names do not match
 * current TypeORM metadata (e.g. planner_event*, event_subjects).
 * Idempotent if 1700000000002 already dropped current-name tables.
 */
export class DropLegacyPublicTenantTables1700000000003
  implements MigrationInterface
{
  name = 'DropLegacyPublicTenantTables1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await dropPublicTenantTables(queryRunner, queryRunner.connection);
  }

  public async down(): Promise<void> {
    // Intentionally empty: public must not hold tenant operational tables.
  }
}
