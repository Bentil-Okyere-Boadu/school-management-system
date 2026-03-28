import { TenantScopedRepositoryService } from './tenant-scoped-repository.service';

describe('TenantScopedRepositoryService', () => {
  it('injects school scope into where object', () => {
    const tenantContext = {
      getTenantIdOrThrow: jest.fn(() => 'school-123'),
    } as any;

    const service = new TenantScopedRepositoryService(tenantContext);
    const where = service.withSchoolScope({ isArchived: false });

    expect(where).toEqual({
      isArchived: false,
      school: { id: 'school-123' },
    });
  });
});
