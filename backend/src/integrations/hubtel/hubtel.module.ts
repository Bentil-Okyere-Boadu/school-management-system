import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubtelController } from './hubtel.controller';
import { HubtelService } from './hubtel.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { HubtelStatusService } from './hubtel-status.service';
import { HubtelReconciliationScheduler } from './hubtel-reconciliation.scheduler';
import { HubtelCredentialsService } from './hubtel-credentials.service';
import { HubtelDirectReceiveService } from './hubtel-direct-receive.service';
import { HubtelDirectReceiveController } from './hubtel-direct-receive.controller';
import { PublicPaymentController } from './public-payment.controller';
import { PublicPaymentService } from './public-payment.service';
import { School } from 'src/school/school.entity';

@Module({
  imports: [PaymentsModule, TypeOrmModule.forFeature([School])],
  controllers: [
    HubtelController,
    HubtelDirectReceiveController,
    PublicPaymentController,
  ],
  providers: [
    HubtelService,
    HubtelStatusService,
    HubtelReconciliationScheduler,
    HubtelCredentialsService,
    HubtelDirectReceiveService,
    PublicPaymentService,
  ],
  exports: [HubtelCredentialsService, HubtelDirectReceiveService],
})
export class HubtelModule {}
