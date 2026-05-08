import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentsService } from 'src/payments/payments.service';
import {
  HubtelInteractionRequestDto,
  HubtelPushType,
} from './dto/hubtel-interaction-request.dto';
import {
  HubtelDataType,
  HubtelInteractionResponseDto,
  HubtelResponseType,
} from './dto/hubtel-interaction-response.dto';
import { PaymentTransactionStatus } from 'src/payments/entities/payment-transaction.entity';
import { Student } from 'src/student/student.entity';
import { HubtelDirectReceiveService } from './hubtel-direct-receive.service';
import { userFacingMessageForHubtelResponseCode } from './hubtel-response-codes';
import { resolveHubtelChannelFromUssd } from './ussd-operator.util';
import {
  buildShortStudentDisplayName,
  buildUssdPaymentPreviewBody,
  formatGhsAmount,
  parseAmountFromUserInput,
  stripNonAsciiForUssd,
  truncateToUssdLimit,
  truncateWithEllipsis,
} from './ussd-text.util';

const MAIN_MENU_MESSAGE =
  'Welcome!\nSchool fees made easy.\n1.Pay all outstanding fees \n2.Pay specific fee\n3.Exit';
const MSG_PAYMENT_SENT = 'Payment sent.\nApprove on your phone.';
const MSG_PAID = 'Payment received.\nThank you.';
const MSG_INVALID = 'Invalid choice. Try again.';
const MSG_NO_FEES = 'No fees due.';
const MSG_BAD_AMOUNT = 'Bad amount. Try again.';
const MSG_PAYMENTS_PAUSED =
  'School payments paused.\nTry again later or contact the school.';
const MSG_UNSUPPORTED_NETWORK = 'Unsupported network. Try web payment.';
const MSG_PAYMENT_ERROR = 'Payment error. Try again later.';

const CLIENT_REFERENCE_MAX_LENGTH = 32;
const HUBTEL_DESCRIPTION_MAX_LENGTH = 80;

@Injectable()
export class HubtelService {
  private readonly logger = new Logger(HubtelService.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly hubtelDirectReceive: HubtelDirectReceiveService,
  ) {}

  // Direct Receive Money is gated on a per-school active flag.
  private schoolHubtelPaymentsEnabled(student: Student): boolean {
    return student.school?.hubtelMerchantActive === true;
  }

  async handleInteraction(
    payload: HubtelInteractionRequestDto,
  ): Promise<HubtelInteractionResponseDto> {
    this.logger.debug(`Hubtel interaction in: ${JSON.stringify(payload)}`);
    try {
      let response: HubtelInteractionResponseDto;
      switch (payload.Type) {
        case HubtelPushType.INITIATION:
          response = this.buildResponse(payload.SessionId, {
            Type: HubtelResponseType.RESPONSE,
            Message: truncateToUssdLimit(MAIN_MENU_MESSAGE),
            Label: 'Welcome',
            DataType: HubtelDataType.INPUT,
            FieldType: 'text',
            ClientState: 'awaiting_action',
            ServiceCode: payload.ServiceCode,
          });
          break;

        case HubtelPushType.TIMEOUT:
          response = this.buildResponse(payload.SessionId, {
            Type: HubtelResponseType.RELEASE,
            Message: 'Session timed out',
            Label: 'Timeout',
            DataType: HubtelDataType.DISPLAY,
            FieldType: 'text',
            ServiceCode: payload.ServiceCode,
          });
          break;

        case HubtelPushType.RESPONSE:
        default:
          response = await this.handleInteractiveResponse(payload);
      }
      this.logger.debug(`Hubtel interaction out: ${JSON.stringify(response)}`);
      return response;
    } catch (err) {
      this.logger.debug(
        `Hubtel interaction error: ${err instanceof Error ? (err.stack ?? err.message) : err}`,
      );
      throw err;
    }
  }

  private async handleInteractiveResponse(
    payload: HubtelInteractionRequestDto,
  ): Promise<HubtelInteractionResponseDto> {
    const clientState = (payload.ClientState ?? '').trim();
    const userInput = (payload.Message ?? '').trim();

    if (!clientState) {
      return this.release(payload, MSG_INVALID);
    }

    if (clientState === 'awaiting_action') {
      return this.onMainMenuSelection(payload, userInput);
    }

    if (
      clientState === 'await_student:all' ||
      clientState === 'await_student:fee'
    ) {
      return this.onStudentIdentifierStep(payload, clientState, userInput);
    }

    const payAllAmountStep = /^stu:([^:]+):payall_amt$/.exec(clientState);
    if (payAllAmountStep) {
      const studentId = payAllAmountStep[1];
      return this.onPayAllAmountStep(payload, studentId, userInput);
    }

    const payAllConfirmStep = /^payall_c:([^:]+):(.+)$/.exec(clientState);
    if (payAllConfirmStep) {
      const studentId = payAllConfirmStep[1];
      const confirmedAmount = Number(payAllConfirmStep[2]);
      return this.onPayAllConfirmStep(
        payload,
        studentId,
        confirmedAmount,
        userInput,
      );
    }

    const feeMenuStep = /^stu:([^:]+):fee_menu$/.exec(clientState);
    if (feeMenuStep) {
      const studentId = feeMenuStep[1];
      return this.onSpecificFeeMenuSelection(payload, studentId, userInput);
    }

    const specificFeeAmountStep = /^stu:([^:]+):feeamt:(\d+)$/.exec(
      clientState,
    );
    if (specificFeeAmountStep) {
      const studentId = specificFeeAmountStep[1];
      const feeListIndex = parseInt(specificFeeAmountStep[2], 10);
      return this.onSpecificFeeAmountStep(
        payload,
        studentId,
        feeListIndex,
        userInput,
      );
    }

    const specificFeeConfirmStep = /^feecnf:([^:]+):(\d+):(.+)$/.exec(
      clientState,
    );
    if (specificFeeConfirmStep) {
      const studentId = specificFeeConfirmStep[1];
      const feeListIndex = parseInt(specificFeeConfirmStep[2], 10);
      const confirmAmount = Number(specificFeeConfirmStep[3]);
      return this.onSpecificFeeConfirmStep(
        payload,
        studentId,
        feeListIndex,
        confirmAmount,
        userInput,
      );
    }

    this.logger.warn(`Unknown Hubtel ClientState: ${clientState}`);
    return this.release(payload, MSG_INVALID);
  }

  private onMainMenuSelection(
    payload: HubtelInteractionRequestDto,
    userInput: string,
  ): Promise<HubtelInteractionResponseDto> {
    if (userInput === '3') {
      return Promise.resolve(this.release(payload, 'Goodbye.'));
    }
    if (userInput === '1') {
      return Promise.resolve(
        this.buildResponse(payload.SessionId, {
          Type: HubtelResponseType.RESPONSE,
          Message: truncateToUssdLimit(
            'Enter student ID or 6-digit billing code\n0. Back',
          ),
          Label: 'Student',
          DataType: HubtelDataType.INPUT,
          FieldType: 'text',
          ClientState: 'await_student:all',
          ServiceCode: payload.ServiceCode,
        }),
      );
    }
    if (userInput === '2') {
      return Promise.resolve(
        this.buildResponse(payload.SessionId, {
          Type: HubtelResponseType.RESPONSE,
          Message: truncateToUssdLimit(
            'Enter student ID or 6-digit billing code\n0. Back',
          ),
          Label: 'Student',
          DataType: HubtelDataType.INPUT,
          FieldType: 'text',
          ClientState: 'await_student:fee',
          ServiceCode: payload.ServiceCode,
        }),
      );
    }
    return Promise.resolve(
      this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(MAIN_MENU_MESSAGE),
        Label: 'Menu',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: 'awaiting_action',
        ServiceCode: payload.ServiceCode,
      }),
    );
  }

  private async onStudentIdentifierStep(
    payload: HubtelInteractionRequestDto,
    awaitingState: string,
    userInput: string,
  ): Promise<HubtelInteractionResponseDto> {
    if (userInput === '0') {
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(MAIN_MENU_MESSAGE),
        Label: 'Menu',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: 'awaiting_action',
        ServiceCode: payload.ServiceCode,
      });
    }

    if (!userInput) {
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(
          'Enter student ID or 6-digit billing code\n0. Back',
        ),
        Label: 'Student',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: awaitingState,
        ServiceCode: payload.ServiceCode,
      });
    }

    try {
      const student =
        await this.paymentsService.resolveStudentByBillingCodeOrStudentId(
          userInput,
        );

      if (!this.schoolHubtelPaymentsEnabled(student)) {
        return this.release(payload, truncateToUssdLimit(MSG_PAYMENTS_PAUSED));
      }

      if (awaitingState === 'await_student:fee') {
        return this.showOutstandingFeeMenu(payload, student);
      }

      const totalOutstanding =
        await this.paymentsService.getTotalOutstandingForStudent(student);
      if (totalOutstanding <= 0) {
        return this.release(
          payload,
          truncateToUssdLimit(
            `No balance.\n${buildShortStudentDisplayName(student.firstName, student.lastName)}`,
          ),
        );
      }

      const studentLabel = buildShortStudentDisplayName(
        student.firstName,
        student.lastName,
      );
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(
          `${studentLabel}\nTotal GHS ${formatGhsAmount(totalOutstanding)}\nEnter amount\n0. Back`,
        ),
        Label: 'Amount',
        DataType: HubtelDataType.INPUT,
        FieldType: 'decimal',
        ClientState: `stu:${student.id}:payall_amt`,
        ServiceCode: payload.ServiceCode,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.buildResponse(payload.SessionId, {
          Type: HubtelResponseType.RESPONSE,
          Message: truncateToUssdLimit('Not found.\nEnter ID or code\n0. Back'),
          Label: 'Student',
          DataType: HubtelDataType.INPUT,
          FieldType: 'text',
          ClientState: awaitingState,
          ServiceCode: payload.ServiceCode,
        });
      }
      throw error;
    }
  }

  private async showOutstandingFeeMenu(
    payload: HubtelInteractionRequestDto,
    student: Student,
  ): Promise<HubtelInteractionResponseDto> {
    const outstandingFees =
      await this.paymentsService.getOutstandingFees(student);
    if (outstandingFees.length === 0) {
      return this.release(payload, MSG_NO_FEES);
    }

    const menuLines: string[] = ['Pick fee:'];
    const feesShownOnMenu = outstandingFees.slice(0, 4);
    feesShownOnMenu.forEach((feeOption, index) => {
      const optionLabel = truncateWithEllipsis(feeOption.feeTitle, 14);
      const amountLabel = formatGhsAmount(feeOption.outstanding);
      menuLines.push(`${index + 1}.${optionLabel} ${amountLabel}`);
    });
    menuLines.push('0. Back');

    return this.buildResponse(payload.SessionId, {
      Type: HubtelResponseType.RESPONSE,
      Message: truncateToUssdLimit(menuLines.join('\n')),
      Label: 'Fees',
      DataType: HubtelDataType.INPUT,
      FieldType: 'text',
      ClientState: `stu:${student.id}:fee_menu`,
      ServiceCode: payload.ServiceCode,
    });
  }

  private async onSpecificFeeMenuSelection(
    payload: HubtelInteractionRequestDto,
    studentId: string,
    userInput: string,
  ): Promise<HubtelInteractionResponseDto> {
    const student = await this.paymentsService.getStudentById(studentId);
    const outstandingFees =
      await this.paymentsService.getOutstandingFees(student);

    if (userInput === '0') {
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(
          'Enter student ID or 6-digit billing code\n0. Back',
        ),
        Label: 'Student',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: 'await_student:fee',
        ServiceCode: payload.ServiceCode,
      });
    }

    const selectedIndex = parseInt(userInput, 10) - 1;
    const maxMenuSlots = Math.min(4, outstandingFees.length);
    if (selectedIndex < 0 || selectedIndex >= maxMenuSlots) {
      return this.showOutstandingFeeMenu(payload, student);
    }

    const selectedFee = outstandingFees[selectedIndex];
    return this.buildResponse(payload.SessionId, {
      Type: HubtelResponseType.RESPONSE,
      Message: truncateToUssdLimit(
        `${truncateWithEllipsis(selectedFee.feeTitle, 16)}\nMax GHS ${formatGhsAmount(selectedFee.outstanding)}\nEnter amount\n0. Back`,
      ),
      Label: 'Amount',
      DataType: HubtelDataType.INPUT,
      FieldType: 'decimal',
      ClientState: `stu:${studentId}:feeamt:${selectedIndex}`,
      ServiceCode: payload.ServiceCode,
    });
  }

  private async onSpecificFeeAmountStep(
    payload: HubtelInteractionRequestDto,
    studentId: string,
    feeListIndex: number,
    userInput: string,
  ): Promise<HubtelInteractionResponseDto> {
    const student = await this.paymentsService.getStudentById(studentId);
    const outstandingFees =
      await this.paymentsService.getOutstandingFees(student);

    if (userInput === '0') {
      return this.showOutstandingFeeMenu(payload, student);
    }

    const selectedFee = outstandingFees[feeListIndex];
    if (!selectedFee) {
      return this.showOutstandingFeeMenu(payload, student);
    }

    const paymentAmount = parseAmountFromUserInput(userInput);
    if (paymentAmount === null || paymentAmount <= 0) {
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(
          `${MSG_BAD_AMOUNT}\nMax ${formatGhsAmount(selectedFee.outstanding)}\n0. Back`,
        ),
        Label: 'Amount',
        DataType: HubtelDataType.INPUT,
        FieldType: 'decimal',
        ClientState: `stu:${studentId}:feeamt:${feeListIndex}`,
        ServiceCode: payload.ServiceCode,
      });
    }

    const allocationPreview =
      await this.paymentsService.previewAllocationForSpecificFee(
        studentId,
        selectedFee.id,
        paymentAmount,
      );
    const previewMessage = buildUssdPaymentPreviewBody(
      paymentAmount,
      buildShortStudentDisplayName(student.firstName, student.lastName),
      allocationPreview,
    );

    return this.buildResponse(payload.SessionId, {
      Type: HubtelResponseType.RESPONSE,
      Message: truncateToUssdLimit(previewMessage),
      Label: 'Confirm',
      DataType: HubtelDataType.INPUT,
      FieldType: 'text',
      ClientState: `feecnf:${studentId}:${feeListIndex}:${formatGhsAmount(paymentAmount)}`,
      ServiceCode: payload.ServiceCode,
    });
  }

  private async onSpecificFeeConfirmStep(
    payload: HubtelInteractionRequestDto,
    studentId: string,
    feeListIndex: number,
    paymentAmount: number,
    userInput: string,
  ): Promise<HubtelInteractionResponseDto> {
    if (userInput === '2') {
      return this.release(payload, 'Cancelled.');
    }
    if (userInput !== '1') {
      const student = await this.paymentsService.getStudentById(studentId);
      const outstandingFees =
        await this.paymentsService.getOutstandingFees(student);
      const selectedFee = outstandingFees[feeListIndex];
      if (!selectedFee) {
        return this.release(payload, MSG_INVALID);
      }
      const allocationPreview =
        await this.paymentsService.previewAllocationForSpecificFee(
          studentId,
          selectedFee.id,
          paymentAmount,
        );
      const previewMessage = buildUssdPaymentPreviewBody(
        paymentAmount,
        buildShortStudentDisplayName(student.firstName, student.lastName),
        allocationPreview,
      );
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(previewMessage),
        Label: 'Confirm',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: `feecnf:${studentId}:${feeListIndex}:${formatGhsAmount(paymentAmount)}`,
        ServiceCode: payload.ServiceCode,
      });
    }

    const student = await this.paymentsService.getStudentById(studentId);
    const outstandingFees =
      await this.paymentsService.getOutstandingFees(student);
    const selectedFee = outstandingFees[feeListIndex];
    if (!selectedFee) {
      return this.release(payload, MSG_INVALID);
    }

    if (!this.schoolHubtelPaymentsEnabled(student)) {
      return this.release(payload, truncateToUssdLimit(MSG_PAYMENTS_PAUSED));
    }

    return this.triggerDirectReceiveAndReleaseSession(
      payload,
      student,
      paymentAmount,
      selectedFee.id,
    );
  }

  private async onPayAllAmountStep(
    payload: HubtelInteractionRequestDto,
    studentId: string,
    userInput: string,
  ): Promise<HubtelInteractionResponseDto> {
    const student = await this.paymentsService.getStudentById(studentId);
    const totalOutstanding =
      await this.paymentsService.getTotalOutstandingForStudent(student);

    if (userInput === '0') {
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(
          'Enter student ID or 6-digit billing code\n0. Back',
        ),
        Label: 'Student',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: 'await_student:all',
        ServiceCode: payload.ServiceCode,
      });
    }

    const paymentAmount = parseAmountFromUserInput(userInput);
    if (paymentAmount === null || paymentAmount <= 0) {
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(
          `${MSG_BAD_AMOUNT}\nMax GHS ${formatGhsAmount(totalOutstanding)}\n0. Back`,
        ),
        Label: 'Amount',
        DataType: HubtelDataType.INPUT,
        FieldType: 'decimal',
        ClientState: `stu:${studentId}:payall_amt`,
        ServiceCode: payload.ServiceCode,
      });
    }

    if (paymentAmount > totalOutstanding + 0.001) {
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(
          `Max GHS ${formatGhsAmount(totalOutstanding)}\nTry again\n0. Back`,
        ),
        Label: 'Amount',
        DataType: HubtelDataType.INPUT,
        FieldType: 'decimal',
        ClientState: `stu:${studentId}:payall_amt`,
        ServiceCode: payload.ServiceCode,
      });
    }

    const allocationPreview = await this.paymentsService.previewAllocation(
      studentId,
      paymentAmount,
    );
    const previewMessage = buildUssdPaymentPreviewBody(
      paymentAmount,
      buildShortStudentDisplayName(student.firstName, student.lastName),
      allocationPreview,
    );

    return this.buildResponse(payload.SessionId, {
      Type: HubtelResponseType.RESPONSE,
      Message: truncateToUssdLimit(previewMessage),
      Label: 'Confirm',
      DataType: HubtelDataType.INPUT,
      FieldType: 'text',
      ClientState: `payall_c:${studentId}:${formatGhsAmount(paymentAmount)}`,
      ServiceCode: payload.ServiceCode,
    });
  }

  private async onPayAllConfirmStep(
    payload: HubtelInteractionRequestDto,
    studentId: string,
    paymentAmount: number,
    userInput: string,
  ): Promise<HubtelInteractionResponseDto> {
    if (userInput === '2') {
      return this.release(payload, 'Cancelled.');
    }
    if (userInput !== '1') {
      const student = await this.paymentsService.getStudentById(studentId);
      const allocationPreview = await this.paymentsService.previewAllocation(
        studentId,
        paymentAmount,
      );
      const previewMessage = buildUssdPaymentPreviewBody(
        paymentAmount,
        buildShortStudentDisplayName(student.firstName, student.lastName),
        allocationPreview,
      );
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: truncateToUssdLimit(previewMessage),
        Label: 'Confirm',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: `payall_c:${studentId}:${formatGhsAmount(paymentAmount)}`,
        ServiceCode: payload.ServiceCode,
      });
    }

    const student = await this.paymentsService.getStudentById(studentId);

    if (!this.schoolHubtelPaymentsEnabled(student)) {
      return this.release(payload, truncateToUssdLimit(MSG_PAYMENTS_PAUSED));
    }

    return this.triggerDirectReceiveAndReleaseSession(
      payload,
      student,
      paymentAmount,
      null,
    );
  }

  // On final confirm, call Hubtel Direct Receive with the school's own
  // credentials so funds settle in the school's merchant account, then
  // RELEASE the USSD session. Final status arrives via the school-scoped
  // PrimaryCallbackUrl.
  private async triggerDirectReceiveAndReleaseSession(
    payload: HubtelInteractionRequestDto,
    student: Student,
    paymentAmount: number,
    targetFeeStructureId: string | null,
  ): Promise<HubtelInteractionResponseDto> {
    const channel = resolveHubtelChannelFromUssd(
      payload.Operator,
      payload.Mobile,
    );
    if (!channel) {
      this.logger.warn(
        `USSD: unable to resolve channel from Operator='${payload.Operator}' Mobile='${payload.Mobile}'`,
      );
      return this.release(payload, MSG_UNSUPPORTED_NETWORK);
    }

    const clientReference = this.toClientReference(payload.SessionId);

    const transaction = await this.paymentsService.createPendingTransaction({
      sessionId: clientReference,
      amount: paymentAmount,
      mobile: payload.Mobile,
      student,
      interactionPayload: payload as unknown as Record<string, unknown>,
      targetFeeStructureId,
    });

    const description = stripNonAsciiForUssd(
      `School fees: ${student.school?.name ?? ''}`.trim(),
    ).slice(0, HUBTEL_DESCRIPTION_MAX_LENGTH);

    try {
      const result = await this.hubtelDirectReceive.initiate({
        school: student.school,
        clientReference,
        amount: paymentAmount,
        customerMsisdn: payload.Mobile,
        channel,
        description,
        customerName: buildShortStudentDisplayName(
          student.firstName,
          student.lastName,
        ),
      });

      const { outcome, hubtelTransactionId, rawResponse } = result;

      if (outcome.kind === 'pending') {
        await this.paymentsService.updateTransactionStatusFromHubtel({
          sessionId: clientReference,
          status: PaymentTransactionStatus.PENDING,
          providerStatus: rawResponse.Message ?? 'Pending',
          hubtelTransactionId,
          charges: 0,
          rawFulfilmentPayload: rawResponse as Record<string, unknown>,
        });
        return this.release(payload, MSG_PAYMENT_SENT);
      }

      if (outcome.kind === 'paid') {
        const updated =
          await this.paymentsService.updateTransactionStatusFromHubtel({
            sessionId: clientReference,
            status: PaymentTransactionStatus.PAID,
            providerStatus: rawResponse.Message ?? 'Paid',
            hubtelTransactionId,
            amount: rawResponse.Data?.Amount ?? paymentAmount,
            charges: rawResponse.Data?.Charges ?? 0,
            amountAfterCharges:
              rawResponse.Data?.AmountAfterCharges ?? paymentAmount,
            rawFulfilmentPayload: rawResponse as Record<string, unknown>,
          });
        await this.paymentsService.allocatePaidTransaction(updated.id);
        return this.release(payload, MSG_PAID);
      }

      await this.paymentsService.markTransactionFailed(
        transaction.id,
        outcome.reason,
        rawResponse as Record<string, unknown>,
      );
      const userMsg = userFacingMessageForHubtelResponseCode(
        outcome.responseCode,
      );
      return this.release(payload, truncateToUssdLimit(userMsg));
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Hubtel call failed';
      this.logger.error(
        `USSD Direct Receive failure for session=${payload.SessionId} school=${student.school?.id}: ${reason}`,
      );
      await this.paymentsService
        .markTransactionFailed(transaction.id, reason)
        .catch(() => undefined);
      return this.release(payload, MSG_PAYMENT_ERROR);
    }
  }

  // Hubtel ClientReference rule: alphanumeric, max 36. We cap at 32 for safety.
  private toClientReference(sessionId: string): string {
    const cleaned = (sessionId ?? '').replace(/[^A-Za-z0-9]/g, '');
    return cleaned.slice(0, CLIENT_REFERENCE_MAX_LENGTH);
  }

  private release(
    payload: HubtelInteractionRequestDto,
    message: string,
  ): HubtelInteractionResponseDto {
    return this.buildResponse(payload.SessionId, {
      Type: HubtelResponseType.RELEASE,
      Message: message,
      Label: 'End',
      DataType: HubtelDataType.DISPLAY,
      FieldType: 'text',
      ServiceCode: payload.ServiceCode,
    });
  }

  private buildResponse(
    sessionId: string,
    response: Omit<HubtelInteractionResponseDto, 'SessionId' | 'Message'> & {
      Message: string;
    },
  ): HubtelInteractionResponseDto {
    return {
      SessionId: sessionId,
      ...response,
      Message: stripNonAsciiForUssd(response.Message),
    };
  }
}
