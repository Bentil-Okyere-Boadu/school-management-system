import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentsService } from 'src/payments/payments.service';
import { PaymentTransactionStatus } from 'src/payments/entities/payment-transaction.entity';
import { SmsService } from 'src/common/services/sms.service';
import {
  HubtelDirectReceiveService,
  InitiateReceiveMoneyResult,
} from './hubtel-direct-receive.service';
import { HubtelCredentialsService } from './hubtel-credentials.service';
import {
  StudentInitiatePaymentDto,
  VerifyAndPayPublicPaymentDto,
} from './dto/initiate-receive-money.dto';

export interface InitiateOtpResult {
  otpRequestId: string;
  expiresAt: Date;
  message: string;
}

export interface VerifyAndPayResult {
  clientReference: string;
  status: PaymentTransactionStatus;
  message: string;
  hubtelTransactionId: string | null;
}

/** Student-authenticated OTP checkout (Bearer JWT): initiate SMS OTP, verify, Direct Receive. */
@Injectable()
export class PublicPaymentService {
  private readonly logger = new Logger(PublicPaymentService.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly hubtelDirectReceive: HubtelDirectReceiveService,
    private readonly credentialsService: HubtelCredentialsService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Step 1: validate the request, generate an OTP, send it via SMS, and
   * return the otpRequestId. Does NOT contact Hubtel yet.
   */
  async initiate(
    dto: StudentInitiatePaymentDto,
    authenticatedStudentId: string,
  ): Promise<InitiateOtpResult> {
    const student = await this.paymentsService.getStudentById(
      authenticatedStudentId,
    );

    if (!student.school) {
      throw new BadRequestException('Student is not linked to a school');
    }

    // Verify the school's Hubtel merchant is configured/active before SMS
    this.credentialsService.fromSchool(student.school);

    // Validate the amount against outstanding fees
    if (dto.targetFeeStructureId) {
      const outstandingFees =
        await this.paymentsService.getOutstandingFees(student);
      const targetFee = outstandingFees.find(
        (f) => f.id === dto.targetFeeStructureId,
      );
      if (!targetFee) {
        throw new BadRequestException(
          'Target fee is not applicable or already paid',
        );
      }
      if (dto.amount > targetFee.outstanding + 0.001) {
        throw new BadRequestException(
          `Amount exceeds outstanding for this fee (max GHS ${targetFee.outstanding.toFixed(2)})`,
        );
      }
    } else {
      const totalOutstanding =
        await this.paymentsService.getTotalOutstandingForStudent(student);
      if (totalOutstanding <= 0) {
        throw new BadRequestException(
          'No outstanding balance for this student',
        );
      }
      if (dto.amount > totalOutstanding + 0.001) {
        throw new BadRequestException(
          `Amount exceeds total outstanding (max GHS ${totalOutstanding.toFixed(2)})`,
        );
      }
    }

    const created = await this.paymentsService.createCheckoutOtp({
      student,
      msisdn: dto.mobileNumber,
      channel: dto.channel,
      amount: dto.amount,
      targetFeeStructureId: dto.targetFeeStructureId ?? null,
      customerName: dto.customerName ?? null,
      customerEmail: dto.customerEmail ?? null,
    });

    try {
      await this.smsService.sendPaymentOtpSms(
        dto.mobileNumber,
        created.otpPlain,
        student.school.name,
        dto.amount,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payment OTP SMS to ${dto.mobileNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BadRequestException(
        'Failed to send OTP. Please verify your number and try again.',
      );
    }

    return {
      otpRequestId: created.otpRequestId,
      expiresAt: created.expiresAt,
      message: 'OTP sent. Enter it to confirm and trigger the MoMo prompt.',
    };
  }

  /**
   * Step 2: consume the OTP, create a PENDING PaymentTransaction, then call
   * Hubtel Direct Receive Money with the school's credentials. The Hubtel
   * response is mapped to PaymentTransactionStatus and persisted.
   */
  async verifyAndPay(
    dto: VerifyAndPayPublicPaymentDto,
    authenticatedStudentId: string,
  ): Promise<VerifyAndPayResult> {
    const { otp, student } =
      await this.paymentsService.verifyAndConsumeCheckoutOtp(
        dto.otpRequestId,
        dto.otp,
      );

    if (student.id !== authenticatedStudentId) {
      throw new ForbiddenException();
    }

    if (!student.school) {
      throw new BadRequestException('Student is not linked to a school');
    }

    const clientReference = this.paymentsService.generateClientReference();

    const transaction = await this.paymentsService.createPendingTransaction({
      sessionId: clientReference,
      student,
      amount: otp.amount,
      mobile: otp.msisdn,
      interactionPayload: {
        source: 'student_otp_checkout',
        otpRequestId: otp.id,
        channel: otp.channel,
      },
      targetFeeStructureId: otp.targetFeeStructureId,
    });

    let initiateResult: InitiateReceiveMoneyResult;
    try {
      initiateResult = await this.hubtelDirectReceive.initiate({
        school: student.school,
        clientReference,
        amount: otp.amount,
        customerMsisdn: otp.msisdn,
        channel: otp.channel,
        description: `School fees: ${student.school.name}`.slice(0, 80),
        customerName: otp.customerName ?? undefined,
        customerEmail: otp.customerEmail ?? undefined,
      });
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Hubtel call failed';
      await this.paymentsService.markTransactionFailed(transaction.id, reason);
      throw new BadRequestException(
        'Failed to initiate payment with Hubtel. Please try again.',
      );
    }

    const { outcome, hubtelTransactionId, rawResponse } = initiateResult;

    const updated =
      await this.paymentsService.updateTransactionStatusFromHubtel({
        sessionId: clientReference,
        status: outcome.status,
        providerStatus:
          outcome.kind === 'failed' ? outcome.reason : rawResponse.Message,
        hubtelTransactionId,
        amount: rawResponse.Data?.Amount ?? otp.amount,
        charges: rawResponse.Data?.Charges ?? 0,
        amountAfterCharges: rawResponse.Data?.AmountAfterCharges ?? otp.amount,
        rawFulfilmentPayload: rawResponse as Record<string, unknown>,
      });

    if (outcome.kind === 'paid') {
      await this.paymentsService.allocatePaidTransaction(updated.id);
    }

    return {
      clientReference,
      status: outcome.status,
      message:
        outcome.kind === 'pending'
          ? 'MoMo prompt sent. Approve on your phone.'
          : outcome.kind === 'paid'
            ? 'Payment processed successfully.'
            : outcome.reason,
      hubtelTransactionId,
    };
  }

  async getStatus(
    clientReference: string,
    authenticatedStudentId: string,
  ): Promise<{
    clientReference: string;
    status: PaymentTransactionStatus;
    amount: number;
    paymentDate: Date | null;
  }> {
    const transaction =
      await this.paymentsService.findTransactionByClientReference(
        clientReference,
      );
    if (!transaction || transaction.student.id !== authenticatedStudentId) {
      throw new NotFoundException('Transaction not found');
    }
    return {
      clientReference,
      status: transaction.status,
      amount: transaction.amount,
      paymentDate: transaction.paymentDate,
    };
  }
}
