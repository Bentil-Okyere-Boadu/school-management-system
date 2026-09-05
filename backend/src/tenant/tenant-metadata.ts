import { DataSource, EntityMetadata } from 'typeorm';
import { TENANT_ENTITIES } from './tenant-entities';

const TENANT_TARGETS = new Set<unknown>(TENANT_ENTITIES);

export function isTenantEntityTarget(target: unknown): boolean {
  return TENANT_TARGETS.has(target);
}

function isJunctionMetadata(meta: EntityMetadata): boolean {
  return meta.tableType === 'junction';
}

export function collectTenantMetadatas(dataSource: DataSource): EntityMetadata[] {
  const metas = new Set<EntityMetadata>();
  for (const meta of dataSource.entityMetadatas) {
    if (typeof meta.target === 'function' && TENANT_TARGETS.has(meta.target)) {
      metas.add(meta);
      for (const rel of meta.manyToManyRelations) {
        if (rel.junctionEntityMetadata) {
          metas.add(rel.junctionEntityMetadata);
        }
      }
    }
  }
  for (const meta of dataSource.entityMetadatas) {
    if (isJunctionMetadata(meta) && !metas.has(meta)) {
      const relatedTenant = meta.manyToManyRelations?.some((rel) => {
        const target = rel.entityMetadata?.target;
        return typeof target === 'function' && TENANT_TARGETS.has(target);
      });
      if (relatedTenant) {
        metas.add(meta);
      }
    }
  }
  return [...metas];
}

export function collectTenantTableNames(dataSource: DataSource): string[] {
  const names = new Set<string>();
  for (const meta of collectTenantMetadatas(dataSource)) {
    if (meta.tableName) {
      names.add(meta.tableName);
    }
  }
  for (const meta of dataSource.entityMetadatas) {
    if (typeof meta.target !== 'function' || !TENANT_TARGETS.has(meta.target)) {
      continue;
    }
    for (const rel of meta.manyToManyRelations) {
      const joinName = rel.joinTableName;
      if (joinName) {
        names.add(joinName);
      }
    }
  }
  return [...names];
}

export function collectPlatformMetadatas(
  dataSource: DataSource,
): EntityMetadata[] {
  const tenant = new Set(collectTenantMetadatas(dataSource));
  return dataSource.entityMetadatas.filter((meta) => {
    if (tenant.has(meta)) {
      return false;
    }
    if (isJunctionMetadata(meta)) {
      return false;
    }
    if (typeof meta.target === 'function' && TENANT_TARGETS.has(meta.target)) {
      return false;
    }
    return true;
  });
}
