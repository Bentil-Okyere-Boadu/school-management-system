import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantResolverService } from './tenant-resolver.service';
import { SchoolProvisioningStatus } from './school-provisioning-status';

describe('TenantConnectionService', () => {
  let service: TenantConnectionService;
  let queryRunner: jest.Mocked<QueryRunner>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue(undefined),
      manager: {} as EntityManager,
    } as unknown as jest.Mocked<QueryRunner>;

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as jest.Mocked<DataSource>;

    const resolver = {
      resolveBySchoolId: jest.fn().mockResolvedValue({
        schoolId: 'school-1',
        schemaName: 'tenant_school_1',
        status: SchoolProvisioningStatus.Active,
        isDisabled: false,
      }),
    } as unknown as TenantResolverService;

    service = new TenantConnectionService(dataSource, resolver);
  });

  it('sets search_path without starting a request-scoped transaction', async () => {
    await service.runForSchoolId('school-1', async () => 'ok');

    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).not.toHaveBeenCalled();
    expect(queryRunner.query).toHaveBeenCalledWith(
      'SET search_path TO "tenant_school_1", public',
    );
    expect(queryRunner.query).toHaveBeenCalledWith('SET search_path TO public');
    expect(queryRunner.release).toHaveBeenCalled();
  });
});
