import { QueryRunner } from 'typeorm';
import { quotePgIdent } from '../tenant/tenant-schema.util';
import { TenantMigrationStep } from '../tenant/tenant-migration.types';

export const version = 1;
export const name = 'parent-invitation-expired-notified-at';

export async function up(
  queryRunner: QueryRunner,
  schemaName: string,
): Promise<void> {
  await queryRunner.query(
    `ALTER TABLE ${quotePgIdent(schemaName)}.parent ADD COLUMN IF NOT EXISTS "invitationExpiredNotifiedAt" timestamptz`,
  );
}

export const parentInvitationExpiredNotifiedAtStep: TenantMigrationStep = {
  version,
  name,
  up,
};
