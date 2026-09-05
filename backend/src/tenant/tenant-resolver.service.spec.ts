import { TenantResolverService } from './tenant-resolver.service';
import { SchoolProvisioningStatus } from './school-provisioning-status';
import { tenantSchemaName } from './tenant-schema.util';

describe('TenantResolverService', () => {
  it('resolves schemaName only from the catalog row', async () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    const schoolRepository = {
      findOne: jest.fn().mockResolvedValue({
        id,
        schemaName: tenantSchemaName(id),
        provisioningStatus: SchoolProvisioningStatus.Active,
        isDisabled: false,
      }),
    };
    const resolver = new TenantResolverService(schoolRepository as never);
    const resolved = await resolver.resolveBySchoolId(id);
    expect(resolved.schemaName).toBe(tenantSchemaName(id));
    expect(resolved.schoolId).toBe(id);
  });

  it('rejects a catalog schemaName that does not match the school id', async () => {
    const schoolRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        schemaName: 'tenant_bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        provisioningStatus: SchoolProvisioningStatus.Active,
        isDisabled: false,
      }),
    };
    const resolver = new TenantResolverService(schoolRepository as never);
    await expect(
      resolver.resolveBySchoolId('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'),
    ).rejects.toThrow('Catalog schemaName does not match school id');
  });
});
