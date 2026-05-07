import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentProviderEvent } from './entities/payment-provider-event.entity';
import { PaymentReceipt } from './entities/payment-receipt.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { CheckoutOtp } from './entities/checkout-otp.entity';
import { Student } from 'src/student/student.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentTransaction,
      PaymentProviderEvent,
      PaymentReceipt,
      PaymentAllocation,
      CheckoutOtp,
      Student,
      FeeStructure,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule {}
