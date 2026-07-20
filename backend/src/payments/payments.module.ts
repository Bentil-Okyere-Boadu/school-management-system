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
import { StudentCreditBalance } from './entities/student-credit-balance.entity';
import { Student } from 'src/student/student.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { School } from 'src/school/school.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { FeeObligationService } from './fee-obligation.service';
import { StudentCreditService } from './student-credit.service';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { ClassLevel } from 'src/class-level/class-level.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentTransaction,
      PaymentProviderEvent,
      PaymentReceipt,
      PaymentAllocation,
      CheckoutOtp,
      StudentFeeObligation,
      StudentCreditBalance,
      Student,
      FeeStructure,
      School,
      AcademicCalendar,
      AcademicTerm,
      ClassLevel,
    ]),
  ],
  controllers: [PaymentsController, FinanceController],
  providers: [
    FeeObligationService,
    StudentCreditService,
    PaymentsService,
    FinanceService,
  ],
  exports: [
    PaymentsService,
    FeeObligationService,
    StudentCreditService,
    FinanceService,
    TypeOrmModule,
  ],
})
export class PaymentsModule {}
