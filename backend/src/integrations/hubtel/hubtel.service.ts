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

const MSG_STUDENT_NOT_FOUND = 'Student not found. Try again.';
const MSG_INVALID_AMOUNT = 'Invalid amount entered';
const MSG_INVALID_SESSION = 'Invalid session. Please start again.';
const MSG_PAYMENT_SENT = 'Payment request sent.\nPlease approve on your phone.';

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
          Message: 'Welcome to SMS School Fees\n1. Pay Fees\n2. Exit',
          Label: 'School fees menu',
          DataType: HubtelDataType.INPUT,
          FieldType: 'text',
          ClientState: 'awaiting_action',
          ServiceCode: payload.ServiceCode,
        });

      case HubtelPushType.TIMEOUT:
        return this.buildResponse(payload.SessionId, {
          Type: HubtelResponseType.RELEASE,
          Message: 'Session timed out',
          Label: 'Session timed out',
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
    const state = (payload.ClientState ?? '').trim();
    const message = (payload.Message ?? '').trim();

    if (!state) {
      return this.release(payload, MSG_INVALID_SESSION);
    }

    if (state === 'awaiting_action') {
      return this.onAwaitingAction(payload, message);
    }

    if (state === 'awaiting_student_identifier') {
      return this.onAwaitingStudentIdentifier(payload, message);
    }

    const chooseMatch = /^student:([^:]+):choose_amount$/.exec(state);
    if (chooseMatch) {
      return this.onChooseAmount(payload, chooseMatch[1], message);
    }

    const enterMatch = /^student:([^:]+):enter_amount$/.exec(state);
    if (enterMatch) {
      return this.onEnterAmount(payload, enterMatch[1], message);
    }

    const confirm = this.parseConfirmState(state);
    if (confirm) {
      return this.onConfirm(
        payload,
        confirm.studentId,
        confirm.amount,
        message,
      );
    }

    this.logger.warn(`Unknown Hubtel ClientState: ${state}`);
    return this.release(payload, MSG_INVALID_SESSION);
  }

  private onAwaitingAction(
    payload: HubtelInteractionRequestDto,
    message: string,
  ): Promise<HubtelInteractionResponseDto> {
    if (message === '2') {
      return Promise.resolve(this.release(payload, 'Goodbye.'));
    }
    if (message === '1') {
      return Promise.resolve(
        this.buildResponse(payload.SessionId, {
          Type: HubtelResponseType.RESPONSE,
          Message: 'Enter student billing code or student ID:',
          Label: 'Billing code or student ID',
          DataType: HubtelDataType.INPUT,
          FieldType: 'text',
          ClientState: 'awaiting_student_identifier',
          ServiceCode: payload.ServiceCode,
        }),
      );
    }
    return Promise.resolve(
      this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: 'Enter 1 or 2.',
        Label: 'Menu',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: 'awaiting_action',
        ServiceCode: payload.ServiceCode,
      }),
    );
  }

  private async onAwaitingStudentIdentifier(
    payload: HubtelInteractionRequestDto,
    message: string,
  ): Promise<HubtelInteractionResponseDto> {
    if (!message) {
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: 'Enter student billing code or student ID:',
        Label: 'Billing code or student ID',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: 'awaiting_student_identifier',
        ServiceCode: payload.ServiceCode,
      });
    }

    try {
      const student =
        await this.paymentsService.resolveStudentByBillingCodeOrStudentId(
          message,
        );
      const outstanding =
        await this.paymentsService.getTotalOutstandingForStudent(student);
      const name = this.formatStudentName(student);
      const body = `${name}\nOutstanding: GHS ${this.formatMoney(outstanding)}\n\n1. Pay Full Amount\n2. Pay Custom Amount`;

      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: body,
        Label: 'Amount option',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: `student:${student.id}:choose_amount`,
        ServiceCode: payload.ServiceCode,
      });
    } catch (e) {
      if (e instanceof NotFoundException) {
        return this.release(payload, MSG_STUDENT_NOT_FOUND);
      }
      throw e;
    }
  }

  private async onChooseAmount(
    payload: HubtelInteractionRequestDto,
    studentId: string,
    message: string,
  ): Promise<HubtelInteractionResponseDto> {
    const student = await this.paymentsService.getStudentById(studentId);
    const outstanding =
      await this.paymentsService.getTotalOutstandingForStudent(student);
    const name = this.formatStudentName(student);

    if (message === '2') {
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: `Enter amount to pay:\n(${name})`,
        Label: 'Amount',
        DataType: HubtelDataType.INPUT,
        FieldType: 'decimal',
        ClientState: `student:${studentId}:enter_amount`,
        ServiceCode: payload.ServiceCode,
      });
    }

    if (message === '1') {
      if (outstanding <= 0) {
        return this.release(payload, `No outstanding balance.\n${name}`);
      }
      return this.promptConfirm(payload, studentId, outstanding, name);
    }

    return this.buildResponse(payload.SessionId, {
      Type: HubtelResponseType.RESPONSE,
      Message: `Enter 1 or 2.\n${name}\nOut: GHS ${this.formatMoney(outstanding)}`,
      Label: 'Amount option',
      DataType: HubtelDataType.INPUT,
      FieldType: 'text',
      ClientState: `student:${studentId}:choose_amount`,
      ServiceCode: payload.ServiceCode,
    });
  }

  private async onEnterAmount(
    payload: HubtelInteractionRequestDto,
    studentId: string,
    message: string,
  ): Promise<HubtelInteractionResponseDto> {
    const student = await this.paymentsService.getStudentById(studentId);
    const name = this.formatStudentName(student);
    const amount = this.parseAmount(message);

    if (amount === null || amount <= 0) {
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: `${MSG_INVALID_AMOUNT}\nEnter amount to pay:\n(${name})`,
        Label: 'Amount',
        DataType: HubtelDataType.INPUT,
        FieldType: 'decimal',
        ClientState: `student:${studentId}:enter_amount`,
        ServiceCode: payload.ServiceCode,
      });
    }

    return this.promptConfirm(payload, studentId, amount, name);
  }

  private promptConfirm(
    payload: HubtelInteractionRequestDto,
    studentId: string,
    amount: number,
    studentName: string,
  ): HubtelInteractionResponseDto {
    const amtStr = this.formatMoney(amount);
    return this.buildResponse(payload.SessionId, {
      Type: HubtelResponseType.RESPONSE,
      Message: `Pay GHS ${amtStr} for ${studentName}?\n1. Confirm\n2. Cancel`,
      Label: 'Confirm payment',
      DataType: HubtelDataType.INPUT,
      FieldType: 'text',
      ClientState: `confirm:${studentId}:${amtStr}`,
      ServiceCode: payload.ServiceCode,
    });
  }

  private async onConfirm(
    payload: HubtelInteractionRequestDto,
    studentId: string,
    amount: number,
    message: string,
  ): Promise<HubtelInteractionResponseDto> {
    if (message === '2') {
      return this.release(payload, 'Payment cancelled.');
    }

    if (message !== '1') {
      const student = await this.paymentsService.getStudentById(studentId);
      const name = this.formatStudentName(student);
      const amtStr = this.formatMoney(amount);
      return this.buildResponse(payload.SessionId, {
        Type: HubtelResponseType.RESPONSE,
        Message: `Enter 1 or 2.\nPay GHS ${amtStr} for ${name}?`,
        Label: 'Confirm payment',
        DataType: HubtelDataType.INPUT,
        FieldType: 'text',
        ClientState: `confirm:${studentId}:${amtStr}`,
        ServiceCode: payload.ServiceCode,
      });
    }

    const student = await this.paymentsService.getStudentById(studentId);

    await this.paymentsService.createPendingTransaction({
      sessionId: payload.SessionId,
      amount,
      mobile: payload.Mobile,
      student,
      interactionPayload: payload as unknown as Record<string, unknown>,
    });

    return this.buildResponse(payload.SessionId, {
      Type: HubtelResponseType.ADD_TO_CART,
      Message: MSG_PAYMENT_SENT,
      Label: 'Approve on phone',
      DataType: HubtelDataType.DISPLAY,
      FieldType: 'text',
      ServiceCode: payload.ServiceCode,
      Item: {
        ItemName: 'School Fees Payment',
        Qty: 1,
        Price: amount,
      },
    });
  }

  private parseConfirmState(
    state: string,
  ): { studentId: string; amount: number } | null {
    const prefix = 'confirm:';
    if (!state.startsWith(prefix)) {
      return null;
    }
    const rest = state.slice(prefix.length);
    const lastColon = rest.lastIndexOf(':');
    if (lastColon <= 0) {
      return null;
    }
    const studentId = rest.slice(0, lastColon);
    const amountStr = rest.slice(lastColon + 1).trim();
    const amount = Number(amountStr);
    if (!studentId || Number.isNaN(amount) || amount <= 0) {
      return null;
    }
    return { studentId, amount };
  }

  private parseAmount(raw: string): number | null {
    const n = Number(String(raw).replace(/,/g, '').trim());
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      return null;
    }
    return Math.round(n * 100) / 100;
  }

  private formatMoney(n: number): string {
    if (Number.isInteger(n)) {
      return String(n);
    }
    return n.toFixed(2).replace(/\.?0+$/, '') || '0';
  }

  private formatStudentName(student: Student): string {
    const first = (student.firstName ?? '').trim();
    const last = (student.lastName ?? '').trim();
    const full = `${first} ${last}`.trim();
    return full || 'Student';
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
      Message: this.toAscii(response.Message),
    };
  }

  private toAscii(text: string): string {
    return text.replace(/[^\x20-\x7E\n]/g, '');
  }
}
