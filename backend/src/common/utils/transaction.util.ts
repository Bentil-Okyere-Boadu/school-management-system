import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

/**
 * Utility class for handling database transactions
 */
@Injectable()
export class TransactionUtil {
  constructor(private dataSource: DataSource) {}

  /**
   * Execute a function within a database transaction
   * If the function throws an error, the transaction will be rolled back
   * @param fn Function to execute within the transaction
   * @returns Promise resolving to the function result
   */
  async executeInTransaction<T>(
    fn: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await fn(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

