import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
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
import { HubtelFulfilmentRequestDto } from './dto/hubtel-fulfilment-request.dto';
import { HubtelCallbackService } from './hubtel-callback.service';
import { PaymentTransactionStatus } from 'src/payments/entities/payment-transaction.entity';
import { Student } from 'src/student/student.entity';
import {
  buildShortStudentDisplayName,
  buildUssdPaymentPreviewBody,
  formatGhsAmount,
  parseAmountFromUserInput,
  stripNonAsciiForUssd,
  truncateToUssdLimit,
  truncateWithEllipsis,
} from './ussd-text.util';

/** USSD main menu (welcome + options); kept short for ~178 char limit. */
const MAIN_MENU_MESSAGE =
  'Welcome!\nSchool fees made easy.\n1.Pay all outstanding fees \n2.Pay specific fee\n3.Exit';
const MSG_PAYMENT_SENT = 'Payment sent.\nApprove on your phone.';
const MSG_INVALID = 'Invalid choice. Try again.';
const MSG_NO_FEES = 'No fees due.';
const MSG_BAD_AMOUNT = 'Bad amount. Try again.';

@Injectable()
export class HubtelService {
  private readonly logger = new Logger(HubtelService.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly callbackService: HubtelCallbackService,
  ) {}

  async handleInteraction(
    payload: HubtelInteractionRequestDto,
  ): Promise<HubtelInteractionResponseDto> {
    switch (payload.Type) {
      case HubtelPushType.INITIATION:
        return this.buildResponse(payload.SessionId, {
          Type: HubtelResponseType.RESPONSE,
          Message: truncateToUssdLimit(MAIN_MENU_MESSAGE),
          Label: 'Welcome',
          DataType: HubtelDataType.INPUT,
          FieldType: 'text',
          ClientState: 'awaiting_action',
          ServiceCode: payload.ServiceCode,
        });

      case HubtelPushType.TIMEOUT:
        return this.buildResponse(payload.SessionId, {
          Type: HubtelResponseType.RELEASE,
          Message: 'Session timed out',
          Label: 'Timeout',
          DataType: HubtelDataType.DISPLAY,
          FieldType: 'text',
          ServiceCode: payload.ServiceCode,
        });

      case HubtelPushType.RESPONSE:
      default:
        return this.handleInteractiveResponse(payload);
    }
  }

  async handleFulfilment(payload: HubtelFulfilmentRequestDto): Promise<{
    ok: boolean;
    duplicate: boolean;
    status: PaymentTransactionStatus;
  }> {
    const eventKey = createHash('sha256')
      .update(
        `${payload.OrderId}:${payload.SessionId}:${payload.OrderInfo?.Status}:${payload.OrderInfo?.Payment?.IsSuccessful}`,
      )
      .digest('hex');
    const event = await this.paymentsService.createProviderEvent({
      eventType: 'hubtel_fulfilment',
      eventKey,
      sessionId: payload.SessionId,
      orderId: payload.OrderId,
      payload: payload as unknown as Record<string, unknown>,
    });

    if (!event.created) {
      return {
        ok: true,
        duplicate: true,
        status: PaymentTransactionStatus.PAID,
      };
    }

    const isPaid =
      payload.OrderInfo?.Payment?.IsSuccessful === true &&
      String(payload.OrderInfo?.Status ?? '').toLowerCase() === 'paid';
    const mappedStatus = isPaid
      ? PaymentTransactionStatus.PAID
      : PaymentTransactionStatus.UNPAID;

    const payment = payload.OrderInfo.Payment;
    const updated =
      await this.paymentsService.updateTransactionStatusFromHubtel({
        sessionId: payload.SessionId,
        orderId: payload.OrderId,
        status: mappedStatus,
        providerStatus: payload.OrderInfo.Status,
        paymentMethod: payment?.PaymentType ?? null,
        paymentDate: payment?.PaymentDate
          ? new Date(payment.PaymentDate)
          : null,
        amount: payment?.AmountPaid ?? 0,
        charges: Math.max(
          0,
          (payment?.AmountPaid ?? 0) - (payment?.AmountAfterCharges ?? 0),
        ),
        amountAfterCharges: payment?.AmountAfterCharges ?? 0,
        rawFulfilmentPayload: payload as unknown as Record<string, unknown>,
      });

    if (mappedStatus === PaymentTransactionStatus.PAID) {
      await this.paymentsService.allocatePaidTransaction(updated.id);
    }

    await this.callbackService.sendFulfilmentCallback({
      SessionId: payload.SessionId,
      OrderId: payload.OrderId,
      ServiceStatus:
        mappedStatus === PaymentTransactionStatus.PAID ? 'success' : 'failed',
      MetaData: null,
    });
    await this.paymentsService.markProviderEventProcessed(event.record.id);

    return { ok: true, duplicate: false, status: mappedStatus };
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

    /* ClientState shape: stu:{studentId}:fee_menu
       Example: stu:a1b2c3d4-0000-4000-8000-000000000001:fee_menu
       user sees "Pick fee:" (up to 4 lines); userInput is 1–4 or 0. Back.
       Regex [^:]+ is the student UUID (hyphens ok; colons would break the pattern). */
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
            'Enter student ID or billing code\n0. Back',
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
            'Enter student ID or billing code\n0. Back',
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
          'Enter student ID or billing code\n0. Back',
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
          'Enter student ID or billing code\n0. Back',
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

    await this.paymentsService.createPendingTransaction({
      sessionId: payload.SessionId,
      amount: paymentAmount,
      mobile: payload.Mobile,
      student,
      interactionPayload: payload as unknown as Record<string, unknown>,
      targetFeeStructureId: selectedFee.id,
    });

    return this.respondWithHubtelAddToCart(payload, paymentAmount);
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
          'Enter student ID or billing code\n0. Back',
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

    await this.paymentsService.createPendingTransaction({
      sessionId: payload.SessionId,
      amount: paymentAmount,
      mobile: payload.Mobile,
      student,
      interactionPayload: payload as unknown as Record<string, unknown>,
      targetFeeStructureId: null,
    });

    return this.respondWithHubtelAddToCart(payload, paymentAmount);
  }

  /** Hubtel checkout step: add line item and prompt MoMo approval on device. */
  private respondWithHubtelAddToCart(
    payload: HubtelInteractionRequestDto,
    cartPriceGhs: number,
  ): HubtelInteractionResponseDto {
    return this.buildResponse(payload.SessionId, {
      Type: HubtelResponseType.ADD_TO_CART,
      Message: MSG_PAYMENT_SENT,
      Label: 'Pay',
      DataType: HubtelDataType.DISPLAY,
      FieldType: 'text',
      ServiceCode: payload.ServiceCode,
      Item: {
        ItemName: 'School Fees',
        Qty: 1,
        Price: cartPriceGhs,
      },
    });
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
