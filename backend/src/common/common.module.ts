import { Module, Global } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { SmsModule } from './modules/sms.module';

@Global()
@Module({
  imports: [SmsModule],
  providers: [EmailService],
  exports: [EmailService, SmsModule],
})
export class CommonModule {}
