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
import { MessageReminderService } from './message-reminder.service';

@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);
  private running = false; // simple overlap guard

  constructor(
    @InjectRepository(MessageReminder)
    private readonly repo: Repository<MessageReminder>,
    private readonly service: MessageReminderService,
  ) {}

  // every 30 seconds (override via REMINDER_CRON if you like)
  @Cron(process.env.REMINDER_CRON ?? '*/30 * * * * *')
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const now = new Date();

      // Find due reminders
      const due = await this.repo.find({
        where: {
          type: ReminderType.SCHEDULED,
          status: ReminderStatus.SCHEDULED,
          scheduledAt: LessThanOrEqual(now),
        },
        relations: [
          'targetStudents',
          'targetStudents.parents',
          'targetStudents.profile', // needed for phoneContact
        ],
        take: 50, // safety cap
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
    } finally {
      this.running = false;
    }
  }
}
