import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { School } from 'src/school/school.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, SchoolAdmin, School])],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
