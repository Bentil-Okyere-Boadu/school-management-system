import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentProviderEvent } from './entities/payment-provider-event.entity';
import { PaymentReceipt } from './entities/payment-receipt.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { CheckoutOtp } from './entities/checkout-otp.entity';
import { StudentFeeObligation } from './entities/student-fee-obligation.entity';
import { Student } from 'src/student/student.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { School } from 'src/school/school.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { FeeObligationService } from './fee-obligation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentTransaction,
      PaymentProviderEvent,
      PaymentReceipt,
      PaymentAllocation,
      CheckoutOtp,
      StudentFeeObligation,
      Student,
      FeeStructure,
      School,
      AcademicCalendar,
      AcademicTerm,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [FeeObligationService, PaymentsService],
  exports: [PaymentsService, FeeObligationService, TypeOrmModule],
})
export class PaymentsModule {}
