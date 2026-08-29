import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { School } from 'src/school/school.entity';
import { SchoolProvisioningStatus } from './school-provisioning-status';
import { TenantMigrationStatus } from './tenant-migration-status';
import {
  loadRegistry,
  stepsForRange,
} from './tenant-migration-registry';
import {
  TENANT_MIGRATION_ADVISORY_LOCK_ID,
  TENANT_SCHEMA_HEAD,
} from './tenant-schema-version';
import {
  TenantMigrationOptions,
  TenantMigrationSummary,
} from './tenant-migration.types';
import {
  assertTenantSchemaName,
  quotePgIdent,
} from './tenant-schema.util';

@Injectable()
export class TenantSchemaMigrator {
  private readonly logger = new Logger(TenantSchemaMigrator.name);

  constructor(private readonly dataSource: DataSource) {}

  async migrateAll(
    options: TenantMigrationOptions = {},
  ): Promise<TenantMigrationSummary> {
    const steps = loadRegistry(options.steps);
    const head = options.head ?? TENANT_SCHEMA_HEAD;
    const summary: TenantMigrationSummary = {
      head,
      ok: 0,
      failed: 0,
      skipped: 0,
      failures: [],
    };

    if (head < 0) {
      throw new Error('Invalid TENANT_SCHEMA_HEAD');
    }

    const lockRunner = this.dataSource.createQueryRunner();
    await lockRunner.connect();
    let lockHeld = false;

    try {
      if (!options.skipAdvisoryLock) {
        const lockRows: Array<{ locked: boolean }> = await lockRunner.query(
          `SELECT pg_try_advisory_lock($1) AS locked`,
          [TENANT_MIGRATION_ADVISORY_LOCK_ID],
        );
        lockHeld = lockRows[0]?.locked === true;
        if (!lockHeld) {
          throw new Error(
            'Tenant migration already running (advisory lock held)',
          );
        }
      }

      const schools = await this.dataSource.getRepository(School).find({
        where: {
          provisioningStatus: SchoolProvisioningStatus.Active,
          isDisabled: false,
        },
        order: { id: 'ASC' },
      });

      for (const school of schools) {
        const schemaName = school.schemaName
          ? assertTenantSchemaName(school.schemaName)
          : null;
        if (!schemaName) {
          this.logger.warn(
            `Skipping school ${school.id}: missing schemaName`,
          );
          summary.skipped++;
          continue;
        }

        const currentVersion = school.tenantSchemaVersion ?? 0;
        if (currentVersion >= head) {
          summary.skipped++;
          continue;
        }

        const pending = stepsForRange(steps, currentVersion, head);
        if (pending.length === 0 && currentVersion < head) {
          const message = `No tenant migration steps between version ${currentVersion} and HEAD ${head}`;
          await this.markFailed(school.id, currentVersion, message);
          summary.failed++;
          summary.failures.push({ schoolId: school.id, error: message });
          continue;
        }

        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
          await qr.query(
            `SET LOCAL search_path TO ${quotePgIdent(schemaName)}, public`,
          );
          await this.markPending(school.id);

          let appliedVersion = currentVersion;
          for (const step of pending) {
            this.logger.log(
              `Migrating school ${school.id} schema ${schemaName}: step ${step.version} ${step.name}`,
            );
            await step.up(qr, schemaName);
            appliedVersion = step.version;
          }

          await qr.manager.update(School, school.id, {
            tenantSchemaVersion: head,
            tenantMigrationStatus: TenantMigrationStatus.Ok,
            lastTenantMigrationError: null,
            lastTenantMigrationAt: new Date(),
          });

          await qr.commitTransaction();
          summary.ok++;
        } catch (error) {
          await qr.rollbackTransaction();
          const message =
            error instanceof Error ? error.message : String(error);
          await this.markFailed(school.id, currentVersion, message);
          summary.failed++;
          summary.failures.push({ schoolId: school.id, error: message });
          this.logger.error(
            `Tenant migration failed for school ${school.id}: ${message}`,
          );
        } finally {
          await qr.release();
        }
      }

      return summary;
    } finally {
      if (lockHeld) {
        await lockRunner.query(`SELECT pg_advisory_unlock($1)`, [
          TENANT_MIGRATION_ADVISORY_LOCK_ID,
        ]);
      }
      await lockRunner.release();
    }
  }

  private async markPending(schoolId: string): Promise<void> {
    await this.dataSource.getRepository(School).update(schoolId, {
      tenantMigrationStatus: TenantMigrationStatus.Pending,
    });
  }

  private async markFailed(
    schoolId: string,
    version: number,
    error: string,
  ): Promise<void> {
    await this.dataSource.getRepository(School).update(schoolId, {
      tenantSchemaVersion: version,
      tenantMigrationStatus: TenantMigrationStatus.Failed,
      lastTenantMigrationError: error,
      lastTenantMigrationAt: new Date(),
    });
  }
}
