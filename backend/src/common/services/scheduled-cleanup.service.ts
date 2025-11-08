import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CleanupService } from './cleanup.service';

/**
 * Service for scheduled cleanup tasks
 */
@Injectable()
export class ScheduledCleanupService {
  private readonly logger = new Logger(ScheduledCleanupService.name);

  constructor(private cleanupService: CleanupService) {}

  /**
   * Run cleanup of orphaned users every week
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOrphanedUsers() {
    this.logger.log('Starting scheduled cleanup of orphaned users...');

    try {
      const result = await this.cleanupService.cleanupOrphanedUsers();
      this.logger.log(`Scheduled cleanup completed: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error(
        'Error during scheduled cleanup of orphaned users:',
        error,
      );
    }
  }

  /**
   * Run cleanup of expired tokens every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens() {
    this.logger.log('Starting scheduled cleanup of expired tokens...');

    try {
      const result = await this.cleanupService.cleanupExpiredTokens();
      this.logger.log(
        `Scheduled token cleanup completed: ${JSON.stringify(result)}`,
      );
    } catch (error) {
      this.logger.error(
        'Error during scheduled cleanup of expired tokens:',
        error,
      );
    }
  }

  /**
   * Log pending users statistics every day at 6 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async logPendingUsersStats() {
    this.logger.log('Getting pending users statistics...');

    try {
      const stats = await this.cleanupService.getPendingUsersStats();
      this.logger.log(`Pending users statistics: ${JSON.stringify(stats)}`);
    } catch (error) {
      this.logger.error('Error getting pending users statistics:', error);
    }
  }
}
