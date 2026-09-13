import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from 'src/school/school.entity';
import { SchoolProvisioningStatus } from './school-provisioning-status';
import { assertTenantSchemaName, tenantSchemaName } from './tenant-schema.util';

export type ResolvedTenant = {
  schoolId: string;
  schemaName: string;
  status: SchoolProvisioningStatus;
  isDisabled: boolean;
};

@Injectable()
export class TenantResolverService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async resolveBySchoolId(schoolId: string): Promise<ResolvedTenant> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school?.schemaName) {
      throw new Error(`No tenant catalog entry for school ${schoolId}`);
    }
    const schemaName = assertTenantSchemaName(school.schemaName);
    if (schemaName !== tenantSchemaName(school.id)) {
      throw new Error('Catalog schemaName does not match school id');
    }
    return {
      schoolId: school.id,
      schemaName,
      status: school.provisioningStatus,
      isDisabled: school.isDisabled,
    };
  }
}
