import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import { TenantSchemaInspector } from './tenant-schema-inspector.service';

@Injectable()
export class TenantSchemaMigrator {
  private readonly logger = new Logger(TenantSchemaMigrator.name);
  private readonly schemaInspector: TenantSchemaInspector;

  constructor(private readonly dataSource: DataSource) {
    this.schemaInspector = new TenantSchemaInspector(dataSource);
  }

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
          const needsHeal = await this.schemaNeedsProductionHeal(schemaName);
          if (!needsHeal) {
            summary.skipped++;
            continue;
          }
        }

        try {
          await this.migrateSchool(school.id, {
            head,
            steps,
            skipAdvisoryLock: true,
          });
          summary.ok++;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          summary.failed++;
          summary.failures.push({ schoolId: school.id, error: message });
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

  async migrateSchool(
    schoolId: string,
    options: Pick<TenantMigrationOptions, 'head' | 'steps' | 'skipAdvisoryLock'> = {},
  ): Promise<School> {
    return this.withMigrationAdvisoryLock(options.skipAdvisoryLock, () =>
      this.executeMigrateSchool(schoolId, options),
    );
  }

  private async withMigrationAdvisoryLock<T>(
    skip: boolean | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    if (skip === true) {
      return fn();
    }

    const lockRunner = this.dataSource.createQueryRunner();
    await lockRunner.connect();
    let lockHeld = false;

    try {
      const lockRows: Array<{ locked: boolean }> = await lockRunner.query(
        `SELECT pg_try_advisory_lock($1) AS locked`,
        [TENANT_MIGRATION_ADVISORY_LOCK_ID],
      );
      lockHeld = lockRows[0]?.locked === true;
      if (!lockHeld) {
        throw new ConflictException('Tenant migration already running');
      }
      return await fn();
    } finally {
      if (lockHeld) {
        await lockRunner.query(`SELECT pg_advisory_unlock($1)`, [
          TENANT_MIGRATION_ADVISORY_LOCK_ID,
        ]);
      }
      await lockRunner.release();
    }
  }

  private async executeMigrateSchool(
    schoolId: string,
    options: Pick<TenantMigrationOptions, 'head' | 'steps' | 'skipAdvisoryLock'>,
  ): Promise<School> {
    const steps = loadRegistry(options.steps);
    const head = options.head ?? TENANT_SCHEMA_HEAD;
    const schoolRepo = this.dataSource.getRepository(School);

    const school = await schoolRepo.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const schemaName = school.schemaName
      ? assertTenantSchemaName(school.schemaName)
      : null;
    if (!schemaName) {
      throw new Error(`School ${school.id}: missing schemaName`);
    }

    const currentVersion = school.tenantSchemaVersion ?? 0;
    let pending = stepsForRange(steps, currentVersion, head);

    if (currentVersion >= head && pending.length === 0) {
      const needsHeal = await this.schemaNeedsProductionHeal(schemaName);
      if (!needsHeal) {
        if (
          school.tenantMigrationStatus === TenantMigrationStatus.Failed ||
          school.tenantMigrationStatus === TenantMigrationStatus.Pending
        ) {
          await schoolRepo.update(school.id, {
            tenantMigrationStatus: TenantMigrationStatus.Ok,
            lastTenantMigrationError: null,
            lastTenantMigrationAt: new Date(),
          });
          const healed = await schoolRepo.findOne({ where: { id: schoolId } });
          if (!healed) {
            throw new NotFoundException('School not found after migration heal');
          }
          return healed;
        }
        return school;
      }

      pending = steps.filter((step) => step.version <= head);
      this.logger.warn(
        `Schema drift detected for school ${school.id} (catalog version ${currentVersion}, HEAD ${head}); replaying ${pending.length} production step(s)`,
      );
    }

    if (pending.length === 0 && currentVersion < head) {
      const message = `No tenant migration steps between version ${currentVersion} and HEAD ${head}`;
      await this.markFailed(school.id, currentVersion, message);
      throw new Error(message);
    }

    if (pending.length === 0) {
      return school;
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.query(
        `SET LOCAL search_path TO ${quotePgIdent(schemaName)}, public`,
      );
      await this.markPending(school.id);

      for (const step of pending) {
        this.logger.log(
          `Migrating school ${school.id} schema ${schemaName}: step ${step.version} ${step.name}`,
        );
        await step.up(qr, schemaName);
      }

      await qr.manager.update(School, school.id, {
        tenantSchemaVersion: Math.max(currentVersion, head),
        tenantMigrationStatus: TenantMigrationStatus.Ok,
        lastTenantMigrationError: null,
        lastTenantMigrationAt: new Date(),
      });

      await qr.commitTransaction();
    } catch (error) {
      await qr.rollbackTransaction();
      const message = error instanceof Error ? error.message : String(error);
      await this.markFailed(school.id, currentVersion, message);
      this.logger.error(
        `Tenant migration failed for school ${school.id}: ${message}`,
      );
      throw error;
    } finally {
      await qr.release();
    }

    const updated = await schoolRepo.findOne({
      where: { id: schoolId },
    });
    if (!updated) {
      throw new NotFoundException('School not found after migration');
    }
    return updated;
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

  /** True when live schema is missing expected production columns/tables. */
  private async schemaNeedsProductionHeal(schemaName: string): Promise<boolean> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      await qr.query(
        `SET LOCAL search_path TO ${quotePgIdent(schemaName)}, public`,
      );
      const expected = this.schemaInspector.buildExpectedFingerprint();
      const actual = await this.schemaInspector.buildActualFingerprint(
        qr,
        schemaName,
      );
      return this.schemaInspector
        .compareFingerprints(expected, actual)
        .some(
          (diff) =>
            diff.includes('missing column') ||
            diff.includes('missing table') ||
            diff.includes('type mismatch'),
        );
    } finally {
      await qr.release();
    }
  }
}
