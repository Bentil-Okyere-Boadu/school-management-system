import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ParentLinkService } from './parent-link.service';

@Injectable()
export class ParentInvitationScheduler {
  private readonly logger = new Logger(ParentInvitationScheduler.name);

  constructor(private readonly parentLinkService: ParentLinkService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async notifyExpiredParentInvitations(): Promise<void> {
    try {
      const count =
        await this.parentLinkService.notifyExpiredParentInvitations();
      if (count > 0) {
        this.logger.log(
          `Notified school admins about ${count} expired parent invitation(s)`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to notify admins about expired parent invitations',
        error,
      );
    }
  }
}
