import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchoolParentVisibilitySettings1700000000009
  implements MigrationInterface
{
  name = 'SchoolParentVisibilitySettings1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.school
        ADD COLUMN IF NOT EXISTS "parentShowScores" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "parentShowGrades" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "parentShowLabels" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "parentShowFeedback" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.school
        DROP COLUMN IF EXISTS "parentShowFeedback",
        DROP COLUMN IF EXISTS "parentShowLabels",
        DROP COLUMN IF EXISTS "parentShowGrades",
        DROP COLUMN IF EXISTS "parentShowScores"
    `);
  }
}
