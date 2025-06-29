import { ObjectLiteral, SelectQueryBuilder, Brackets } from 'typeorm';

export interface QueryString {
  page?: string;
  sort?: string;
  limit?: string;
  fields?: string;
  [key: string]: string | undefined;
}

export class APIFeatures<T extends ObjectLiteral> {
  private query: SelectQueryBuilder<T>;
  private queryString: QueryString;

  constructor(query: SelectQueryBuilder<T>, queryString: QueryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    Object.entries(queryObj).forEach(([key, value]) => {
      if (value !== undefined) {
        // Match comparison operators (e.g., createdAt_ge)
        const match = key.match(/^([a-zA-Z]+)_(ge|le|gt|lt)$/);
        if (match) {
          const [_, field, operator] = match;
          const conditionValue = value;

          const operatorMap: Record<string, string> = {
            ge: '>=',
            le: '<=',
            gt: '>',
            lt: '<',
          };

          const operatorString = operatorMap[operator] ?? '=';

          this.query = this.query.andWhere(
            `${this.query.alias}.${field} ${operatorString} :${field}`,
            { [field]: conditionValue },
          );
        } else if (key === 'role') {
          this.query = this.query.andWhere(`role.id = :roleId`, {
            roleId: value,
          });
        } else if (key === 'roleLabel') {
          this.query = this.query.andWhere(`role.label = :roleLabel`, {
            roleLabel: value,
          });
        } else {
          this.query = this.query.andWhere(
            `${this.query.alias}.${key} = :${key}`,
            { [key]: value },
          );
        }
      }
    });

    return this;
  }

  sort(): this {
    if (this.queryString.sort) {
      const [field, order] = this.queryString.sort.split(',');
      this.query = this.query.orderBy(
        `${this.query.alias}.${field}`,
        (order?.toUpperCase() as 'ASC' | 'DESC') || 'DESC',
      );
    } else {
      this.query = this.query.orderBy(`${this.query.alias}.createdAt`, 'DESC');
    }
    return this;
  }

  limitFields(): this {
    if (this.queryString.fields) {
      const requestedFields = this.queryString.fields
        .split(',')
        .map((f) => f.trim());

      // Always include essential fields
      const essentialFields = ['id', 'createdAt'];
      const combinedFields = Array.from(
        new Set([...requestedFields, ...essentialFields]),
      );

      const fields = combinedFields.map((f) => `${this.query.alias}.${f}`);
      this.query = this.query.select(fields);
    }
    return this;
  }
  search(fieldsToSearch: string[] = []): this {
    const searchValue = this.queryString.search;
    if (searchValue && fieldsToSearch.length > 0) {
      this.query = this.query.andWhere(
        new Brackets((qb: SelectQueryBuilder<T>) => {
          for (const field of fieldsToSearch) {
            qb.orWhere(`${qb.alias}.${field} ILIKE :searchTerm`, {
              searchTerm: `%${searchValue}%`,
            });
          }
        }),
      );
    }

    return this;
  }

  paginate(): this {
    const page = parseInt(this.queryString.page ?? '1', 10);
    const limit = parseInt(this.queryString.limit ?? '20', 10);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).take(limit);
    return this;
  }

  getQuery(): SelectQueryBuilder<T> {
    return this.query;
  }
}
