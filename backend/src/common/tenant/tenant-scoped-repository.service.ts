import { Injectable } from '@nestjs/common';
import {
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { TenantContextService } from './tenant-context.service';

type WhereWithSchool<T> = T & {
  school?: {
    id: string;
  };
};

@Injectable()
export class TenantScopedRepositoryService {
  constructor(private readonly tenantContext: TenantContextService) {}

  withSchoolScope<T extends ObjectLiteral>(where?: T): WhereWithSchool<T> {
    return {
      ...(where || ({} as T)),
      school: { id: this.tenantContext.getTenantIdOrThrow() },
    };
  }

  scopeQueryBuilder<T extends ObjectLiteral>(
    repository: Repository<T>,
    alias: string,
    schoolRelation = `${alias}.school`,
  ) {
    return repository
      .createQueryBuilder(alias)
      .andWhere(`${schoolRelation}.id = :schoolId`, {
        schoolId: this.tenantContext.getTenantIdOrThrow(),
      });
  }

  find<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: Omit<FindManyOptions<T>, 'where'> & { where?: T } = {},
  ) {
    return repository.find({
      ...options,
      where: this.withSchoolScope(options.where),
    } as FindManyOptions<T>);
  }

  findOne<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: Omit<FindOneOptions<T>, 'where'> & { where?: T },
  ) {
    return repository.findOne({
      ...options,
      where: this.withSchoolScope(options.where),
    } as FindOneOptions<T>);
  }

  count<T extends ObjectLiteral>(repository: Repository<T>, where?: T) {
    return repository.count({
      where: this.withSchoolScope(where),
    } as FindManyOptions<T>);
  }
}
