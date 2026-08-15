import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ParentAuthorizationService } from './parent.authorization';
import { PaymentsService } from 'src/payments/payments.service';
import { HubtelCredentialsService } from 'src/integrations/hubtel/hubtel-credentials.service';
import { HubtelDirectReceiveService } from 'src/integrations/hubtel/hubtel-direct-receive.service';
import { SmsService } from 'src/common/services/sms.service';
import { ParentInitiatePaymentDto } from './dto/parent-payment.dto';
import { VerifyAndPayPublicPaymentDto } from 'src/integrations/hubtel/dto/initiate-receive-money.dto';
import { PaymentTransactionStatus } from 'src/payments/entities/payment-transaction.entity';
import { userFacingMessageForHubtelResponseCode } from 'src/integrations/hubtel/hubtel-response-codes';

@Injectable()
export class ParentPaymentService {
  private readonly logger = new Logger(ParentPaymentService.name);

  constructor(
    private readonly authorization: ParentAuthorizationService,
    private readonly paymentsService: PaymentsService,
    private readonly credentialsService: HubtelCredentialsService,
    private readonly hubtelDirectReceive: HubtelDirectReceiveService,
    private readonly smsService: SmsService,
  ) {}

  async initiate(parentId: string, dto: ParentInitiatePaymentDto) {
    const seen = new Set<string>();
    const allocations: { studentId: string; amount: number }[] = [];
    let anchorStudent = null as Awaited<
      ReturnType<ParentAuthorizationService['requireActiveParentStudent']>
    >['student'] | null;

    for (const child of dto.children) {
      if (seen.has(child.studentId)) {
        throw new BadRequestException('Duplicate student in payment request');
      }
      seen.add(child.studentId);

      const { student } = await this.authorization.requireActiveParentStudent(
        parentId,
        child.studentId,
      );
      if (!anchorStudent) {
        anchorStudent = student;
      }

      const outstanding =
        await this.paymentsService.getTotalOutstandingForStudent(student, {
          ussdEligibleOnly: false,
        });
      if (outstanding <= 0) {
        throw new BadRequestException(
          `No outstanding balance for ${student.firstName} ${student.lastName}`,
        );
      }
      if (child.amount > outstanding + 0.001) {
        throw new BadRequestException(
          `Amount for ${student.firstName} exceeds outstanding (max GHS ${outstanding.toFixed(2)})`,
        );
      }
      allocations.push({
        studentId: student.id,
        amount: Math.round(child.amount * 100) / 100,
      });
    }

    if (!anchorStudent?.school) {
      throw new BadRequestException('Student is not linked to a school');
    }

    this.credentialsService.fromSchool(anchorStudent.school);

    const total = Math.round(
      allocations.reduce((sum, row) => sum + row.amount, 0) * 100,
    ) / 100;

    const created = await this.paymentsService.createCheckoutOtp({
      student: anchorStudent,
      msisdn: dto.mobileNumber,
      channel: dto.channel,
      amount: total,
      targetFeeStructureId: null,
      customerName: dto.customerName ?? `${anchorStudent.firstName} guardian`,
      customerEmail: dto.customerEmail ?? null,
      parentId,
      allocations,
    });

    try {
      await this.smsService.sendPaymentOtpSms(
        dto.mobileNumber,
        created.otpPlain,
        anchorStudent.school.name,
        total,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send parent payment OTP: ${
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
      total,
      allocations,
      message: 'OTP sent. Enter it to confirm and trigger the MoMo prompt.',
    };
  }

  async verifyAndPay(parentId: string, dto: VerifyAndPayPublicPaymentDto) {
    const { otp, student } =
      await this.paymentsService.verifyAndConsumeCheckoutOtp(
        dto.otpRequestId,
        dto.otp,
      );

    if (otp.parentId !== parentId) {
      throw new ForbiddenException();
    }

    const allocations = otp.allocations?.length
      ? otp.allocations
      : [{ studentId: student.id, amount: otp.amount }];

    for (const allocation of allocations) {
      await this.authorization.requireActiveParentStudent(
        parentId,
        allocation.studentId,
      );
    }

    if (!student.school) {
      throw new BadRequestException('Student is not linked to a school');
    }

    const clientReference = this.paymentsService.generateClientReference();

    let initiateResult;
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
      this.logger.error(
        `Hubtel initiate failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BadRequestException(
        'Failed to initiate payment with Hubtel. Please try again.',
      );
    }

    const results: {
      studentId: string;
      sessionId: string;
      status: PaymentTransactionStatus;
      amount: number;
      transactionId: string;
    }[] = [];
    for (const [index, allocation] of allocations.entries()) {
      const { student: child } =
        await this.authorization.requireActiveParentStudent(
          parentId,
          allocation.studentId,
        );
      const sessionId = `${clientReference}${index}`.slice(0, 36);
      const transaction = await this.paymentsService.createPendingTransaction({
        sessionId,
        student: child,
        amount: allocation.amount,
        mobile: otp.msisdn,
        interactionPayload: {
          source: 'parent_otp_checkout',
          otpRequestId: otp.id,
          channel: otp.channel,
          parentId,
          hubtelClientReference: clientReference,
        },
      });

      const updated =
        await this.paymentsService.updateTransactionStatusFromHubtel({
          sessionId,
          status: initiateResult.outcome.status,
          providerStatus:
            initiateResult.outcome.kind === 'failed'
              ? initiateResult.outcome.reason
              : initiateResult.rawResponse.Message,
          hubtelTransactionId: initiateResult.hubtelTransactionId,
          amount: allocation.amount,
          charges: 0,
          amountAfterCharges: allocation.amount,
          rawFulfilmentPayload: initiateResult.rawResponse as Record<
            string,
            unknown
          >,
        });

      if (initiateResult.outcome.kind === 'paid') {
        await this.paymentsService.allocatePaidTransaction(updated.id);
      }

      results.push({
        studentId: child.id,
        sessionId,
        status: updated.status,
        amount: allocation.amount,
        transactionId: updated.id,
      });
    }

    return {
      clientReference,
      status: initiateResult.outcome.status,
      message:
        initiateResult.outcome.kind === 'pending'
          ? 'MoMo prompt sent. Approve on your phone.'
          : initiateResult.outcome.kind === 'paid'
            ? 'Payment processed successfully.'
            : userFacingMessageForHubtelResponseCode(
                initiateResult.outcome.responseCode,
              ),
      allocations: results,
    };
  }

  async getStatus(parentId: string, clientReference: string) {
    const transaction =
      await this.paymentsService.findTransactionByClientReference(
        `${clientReference}0`.slice(0, 36),
      );
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    await this.authorization.requireActiveParentStudent(
      parentId,
      transaction.student.id,
    );
    return {
      clientReference,
      status: transaction.status as PaymentTransactionStatus,
      amount: transaction.amount,
      paymentDate: transaction.paymentDate,
    };
  }
}
