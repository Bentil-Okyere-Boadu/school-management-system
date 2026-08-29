import { DataSource, EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { TenantConnectionService } from './tenant-connection.service';
import { collectTenantMetadatas } from './tenant-metadata';

/**
 * Nest caches TypeORM Repository instances at boot, bound to the default
 * (public) manager. Redirect tenant repositories to the request QueryRunner
 * EntityManager when AsyncLocalStorage has a tenant store.
 */
export function bindTenantRepositories(
  dataSource: DataSource,
  tenantConnection: TenantConnectionService,
): void {
  for (const meta of collectTenantMetadatas(dataSource)) {
    const repo = dataSource.getRepository(
      meta.target,
    ) as Repository<ObjectLiteral>;
    bindRepositoryManager(repo, tenantConnection);
  }
}

function bindRepositoryManager(
  repo: Repository<ObjectLiteral>,
  tenantConnection: TenantConnectionService,
): void {
  const defaultManager: EntityManager = repo.manager;
  Object.defineProperty(repo, 'manager', {
    configurable: true,
    get(): EntityManager {
      const store = tenantConnection.tryGetStore();
      return store ? store.manager : defaultManager;
    },
  });
}
