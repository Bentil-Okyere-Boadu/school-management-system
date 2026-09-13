import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { School } from 'src/school/school.entity';
import { SchoolProvisioningStatus } from './school-provisioning-status';
import { quotePgIdent, tenantSchemaName } from './tenant-schema.util';
import { EventCategory } from 'src/planner/entities/event-category.entity';
import { GradingSystem } from 'src/grading-system/grading-system.entity';
import { applyTenantSchemaTables } from './tenant-ddl';
import { TenantSchemaInspector } from './tenant-schema-inspector.service';
import { TenantMigrationStatus } from './tenant-migration-status';
import { TENANT_SCHEMA_HEAD } from './tenant-schema-version';

@Injectable()
export class TenantProvisionerService {
  private readonly logger = new Logger(TenantProvisionerService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly schemaInspector: TenantSchemaInspector,
  ) {}

  async provision(school: School): Promise<School> {
    const schemaName = tenantSchemaName(school.id);
    school.schemaName = schemaName;
    school.provisioningStatus = SchoolProvisioningStatus.Provisioning;
    school.lastProvisionError = null;
    await this.dataSource.getRepository(School).save(school);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.query(`CREATE SCHEMA IF NOT EXISTS ${quotePgIdent(schemaName)}`);
      await applyTenantSchemaTables(qr, this.dataSource, schemaName);
      await qr.query(
        `SET LOCAL search_path TO ${quotePgIdent(schemaName)}, public`,
      );
      await this.seedDefaults(qr.manager, school);

      await this.schemaInspector.assertSchemaMatchesHead(qr, schemaName);

      await qr.commitTransaction();

      school.provisioningStatus = SchoolProvisioningStatus.Active;
      school.provisionedAt = new Date();
      school.lastProvisionError = null;
      school.tenantSchemaVersion = TENANT_SCHEMA_HEAD;
      school.tenantMigrationStatus = TenantMigrationStatus.Ok;
      school.lastTenantMigrationError = null;
      school.lastTenantMigrationAt = new Date();
      return this.dataSource.getRepository(School).save(school);
    } catch (error) {
      await qr.rollbackTransaction();
      school.provisioningStatus = SchoolProvisioningStatus.Failed;
      school.lastProvisionError =
        error instanceof Error ? error.message : String(error);
      await this.dataSource.getRepository(School).save(school);
      this.logger.error(
        `Provisioning failed for school ${school.id}`,
        school.lastProvisionError,
      );
      throw error;
    } finally {
      await qr.release();
    }
  }

  private async seedDefaults(
    manager: EntityManager,
    school: School,
  ): Promise<void> {
    const categoryRepo = manager.getRepository(EventCategory);
    const existing = await categoryRepo.count();
    if (existing === 0) {
      await categoryRepo.save([
        categoryRepo.create({
          name: 'General',
          color: '#6366f1',
          description: 'General events',
          school,
        }),
        categoryRepo.create({
          name: 'Uncategorized',
          color: '#94a3b8',
          description: 'Uncategorized events',
          school,
        }),
        categoryRepo.create({
          name: 'School Event',
          color: '#10b981',
          description: 'School-wide events and activities',
          school,
        }),
        categoryRepo.create({
          name: 'Class Assignment',
          color: '#f59e0b',
          description: 'Assignment due dates for class levels',
          school,
        }),
      ]);
    }
    const gradeRepo = manager.getRepository(GradingSystem);
    if ((await gradeRepo.count()) === 0) {
      const defaults = [
        { grade: 'A', minRange: 80, maxRange: 100 },
        { grade: 'B', minRange: 70, maxRange: 79 },
        { grade: 'C', minRange: 60, maxRange: 69 },
        { grade: 'D', minRange: 50, maxRange: 59 },
        { grade: 'E', minRange: 45, maxRange: 49 },
        { grade: 'F', minRange: 0, maxRange: 44 },
      ];
      await gradeRepo.save(
        defaults.map((row) => gradeRepo.create({ ...row, school })),
      );
    }
  }
}
