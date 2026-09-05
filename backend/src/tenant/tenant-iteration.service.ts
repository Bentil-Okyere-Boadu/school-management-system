import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from 'src/school/school.entity';
import { SchoolProvisioningStatus } from './school-provisioning-status';
import { TenantConnectionService } from './tenant-connection.service';

@Injectable()
export class TenantIterationService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  async forEachActiveSchool(
    fn: (schoolId: string) => Promise<void>,
  ): Promise<void> {
    const schools = await this.schoolRepository.find({
      where: {
        provisioningStatus: SchoolProvisioningStatus.Active,
        isDisabled: false,
      },
    });
    for (const school of schools) {
      await this.tenantConnection.runForSchoolId(school.id, async () => {
        await fn(school.id);
      });
    }
  }
}
