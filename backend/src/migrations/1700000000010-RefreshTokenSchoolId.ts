import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reasserts refresh_token.schoolId for databases that ran an earlier
 * PlatformCatalog1700000000001 before this column was added.
 */
export class RefreshTokenSchoolId1700000000010 implements MigrationInterface {
  name = 'RefreshTokenSchoolId1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.refresh_token
        ADD COLUMN IF NOT EXISTS "schoolId" uuid
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.refresh_token
        DROP COLUMN IF EXISTS "schoolId"
    `);
  }
}
