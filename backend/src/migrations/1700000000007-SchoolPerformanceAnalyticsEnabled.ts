import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchoolPerformanceAnalyticsEnabled1700000000007 implements MigrationInterface {
  name = 'SchoolPerformanceAnalyticsEnabled1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.school
        ADD COLUMN IF NOT EXISTS "performanceAnalyticsEnabled" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.school
        DROP COLUMN IF EXISTS "performanceAnalyticsEnabled"
    `);
  }
}
