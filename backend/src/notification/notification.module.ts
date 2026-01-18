import { NotificationService as CommonNotificationService } from './../common/services/notification.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationService as LocalNotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MessageReminder } from './entities/message-reminder.entity';
import { MessageReminderService } from './message-reminder.service';
import { MessageReminderController } from './message-reminder.controller';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { School } from 'src/school/school.entity';
import { Student } from 'src/student/student.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { CommonModule } from '../common/common.module';
import { ReminderScheduler } from './reminder.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      MessageReminder,
      SchoolAdmin,
      School,
      Student,
      ClassLevel,
    ]),
    CommonModule,
  ],
  providers: [
    CommonNotificationService,
    MessageReminderService,
    LocalNotificationService,
    ReminderScheduler,
  ],
  controllers: [NotificationController, MessageReminderController],
  exports: [LocalNotificationService, MessageReminderService],
})
export class NotificationModule {}
