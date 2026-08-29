import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './services/email.service';
import { EmailRetryService } from './services/email-retry.service';
import { SmsModule } from './modules/sms.module';
import { TransactionUtil } from './utils/transaction.util';
import { CleanupService } from './services/cleanup.service';
import { ScheduledCleanupService } from './services/scheduled-cleanup.service';
import { CleanupController } from './controllers/cleanup.controller';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { Student } from 'src/student/student.entity';
import { PlatformInvitation } from 'src/tenant/entities/platform-invitation.entity';
import { TenantContextService } from './tenant/tenant-context.service';
import { EncryptionService } from './utils/encryption.util';

@Global()
@Module({
  imports: [
    SmsModule,
    TypeOrmModule.forFeature([
      SchoolAdmin,
      Teacher,
      Student,
      PlatformInvitation,
    ]),
  ],
  controllers: [CleanupController],
  providers: [
    EmailService,
    EmailRetryService,
    TransactionUtil,
    CleanupService,
    ScheduledCleanupService,
    TenantContextService,
    EncryptionService,
  ],
  exports: [
    EmailService,
    EmailRetryService,
    SmsModule,
    TransactionUtil,
    CleanupService,
    ScheduledCleanupService,
    TenantContextService,
    EncryptionService,
  ],
})
export class CommonModule {}
