import { MigrationInterface, QueryRunner } from 'typeorm';
import { dropPublicTenantTables } from '../tenant/tenant-ddl';

/**
 * Removes current TypeORM tenant tables from public, plus documented
 * legacy aliases (planner_event*, event_subjects). Uses DROP IF EXISTS.
 */
export class DropPublicTenantTables1700000000002 implements MigrationInterface {
  name = 'DropPublicTenantTables1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await dropPublicTenantTables(queryRunner, queryRunner.connection);
  }

  public async down(): Promise<void> {
    // Tenant tables are recreated per school by the provisioner, not in public.
  }
}
