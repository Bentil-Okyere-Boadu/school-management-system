// message-reminder/reminder.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import {
  MessageReminder,
  ReminderStatus,
  ReminderType,
} from './entities/message-reminder.entity';
import { TenantIterationService } from 'src/tenant/tenant-iteration.service';
import { MessageReminderService } from './message-reminder.service';

@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);
  private running = false; // simple overlap guard

  constructor(
    @InjectRepository(MessageReminder)
    private readonly repo: Repository<MessageReminder>,
    private readonly service: MessageReminderService,
    private readonly tenantIteration: TenantIterationService,
  ) {}

  @Cron(process.env.REMINDER_CRON ?? '0 */2 * * * *')
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.tenantIteration.forEachActiveSchool(async () => {
        const now = new Date();
        const due = await this.repo.find({
          where: {
            type: ReminderType.SCHEDULED,
            status: ReminderStatus.SCHEDULED,
            scheduledAt: LessThanOrEqual(now),
          },
          relations: [
            'targetStudents',
            'targetStudents.parentStudents',
            'targetStudents.parentStudents.parent',
            'targetStudents.profile',
          ],
          take: 50,
        });

        for (const r of due) {
          try {
            await this.service.sendReminderNotifications(r);
            r.status = ReminderStatus.ACTIVE;
            r.lastSentAt = new Date();
            await this.repo.save(r);
            this.logger.log(`Sent scheduled reminder ${r.id}`);
          } catch (e) {
            this.logger.error(
              `Failed sending scheduled reminder ${r.id}: ${(e as Error).message}`,
            );
          }
        }
      });
    } finally {
      this.running = false;
    }
  }
}
