import { QueryRunner, Table, TableForeignKey } from 'typeorm';
import {
  createForeignKeysIdempotent,
  foreignKeyExists,
} from './tenant-ddl';

describe('tenant-ddl foreign key helpers', () => {
  const schemaName = 'tenant_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  function mockTable(fkNames: string[]): Table {
    const table = new Table({
      schema: schemaName,
      name: 'student',
    });
    table.foreignKeys = fkNames.map(
      (name) =>
        new TableForeignKey({
          name,
          columnNames: ['schoolId'],
          referencedTableName: 'school',
          referencedColumnNames: ['id'],
        }),
    );
    return table;
  }

  it('foreignKeyExists returns true when pg_constraint row is present', async () => {
    const queryRunner = {
      query: jest.fn().mockResolvedValue([{ exists: true }]),
    } as unknown as QueryRunner;

    await expect(
      foreignKeyExists(queryRunner, schemaName, 'FK_student_school'),
    ).resolves.toBe(true);
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('pg_constraint'),
      [schemaName, 'FK_student_school'],
    );
  });

  it('createForeignKeysIdempotent skips FKs that already exist', async () => {
    const queryRunner = {
      query: jest.fn().mockResolvedValue([{ exists: true }]),
      createForeignKeys: jest.fn().mockResolvedValue(undefined),
    } as unknown as QueryRunner;

    await createForeignKeysIdempotent(
      queryRunner,
      mockTable(['FK_existing']),
    );

    expect(queryRunner.createForeignKeys).not.toHaveBeenCalled();
  });

  it('createForeignKeysIdempotent creates only missing FKs', async () => {
    const queryRunner = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ exists: true }])
        .mockResolvedValueOnce([{ exists: false }]),
      createForeignKeys: jest.fn().mockResolvedValue(undefined),
    } as unknown as QueryRunner;

    const table = mockTable(['FK_existing', 'FK_missing']);
    await createForeignKeysIdempotent(queryRunner, table);

    expect(queryRunner.createForeignKeys).toHaveBeenCalledTimes(1);
    expect(queryRunner.createForeignKeys).toHaveBeenCalledWith(table, [
      table.foreignKeys![1],
    ]);
  });
});
