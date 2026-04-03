import { Module } from '@nestjs/common';
import { HubtelController } from './hubtel.controller';
import { HubtelService } from './hubtel.service';
import { PaymentsModule } from 'src/payments/payments.module';
import { HubtelCallbackService } from './hubtel-callback.service';
import { HubtelStatusService } from './hubtel-status.service';
import { HubtelReconciliationScheduler } from './hubtel-reconciliation.scheduler';

@Module({
  imports: [PaymentsModule],
  controllers: [HubtelController],
  providers: [
    HubtelService,
    HubtelCallbackService,
    HubtelStatusService,
    HubtelReconciliationScheduler,
  ],
})
export class HubtelModule {}
