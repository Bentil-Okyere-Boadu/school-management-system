import { MigrationInterface, QueryRunner } from 'typeorm';

export class TenantDirectoryLoginEligible1700000000008
  implements MigrationInterface
{
  name = 'TenantDirectoryLoginEligible1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.tenant_directory
        ADD COLUMN IF NOT EXISTS "loginEligible" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.tenant_directory
        DROP COLUMN IF EXISTS "loginEligible"
    `);
  }
}
