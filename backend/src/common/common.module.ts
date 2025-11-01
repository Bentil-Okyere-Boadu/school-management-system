import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './services/email.service';
import { SmsModule } from './modules/sms.module';
import { TransactionUtil } from './utils/transaction.util';
import { CleanupService } from './services/cleanup.service';
import { ScheduledCleanupService } from './services/scheduled-cleanup.service';
import { CleanupController } from './controllers/cleanup.controller';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { Student } from 'src/student/student.entity';

@Global()
@Module({
  imports: [
    SmsModule,
    TypeOrmModule.forFeature([SchoolAdmin, Teacher, Student]),
  ],
  controllers: [CleanupController],
  providers: [
    EmailService,
    TransactionUtil,
    CleanupService,
    ScheduledCleanupService,
  ],
  exports: [
    EmailService,
    SmsModule,
    TransactionUtil,
    CleanupService,
    ScheduledCleanupService,
  ],
})
export class CommonModule {}
