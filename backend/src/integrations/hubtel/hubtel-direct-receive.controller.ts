import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createHash } from 'crypto';
import { PaymentsService } from 'src/payments/payments.service';
import { HubtelReceiveMoneyCallbackDto } from './dto/hubtel-receive-money-callback.dto';
import { mapHubtelResponseCode } from './hubtel-response-codes';

@ApiTags('Hubtel Integrations')
@Controller('integrations/hubtel/receive-money')
export class HubtelDirectReceiveController {
  private readonly logger = new Logger(HubtelDirectReceiveController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('callback/:schoolId')
  @HttpCode(200)
  async receiveMoneyCallback(
    @Param('schoolId') schoolId: string,
    @Body() payload: HubtelReceiveMoneyCallbackDto,
  ) {
    const clientReference = payload?.Data?.ClientReference?.trim();
    const responseCode = String(payload?.ResponseCode ?? '').trim();
    const transactionIdFromHubtel =
      payload?.Data?.TransactionId?.toString().trim() || null;
    const externalTxnId =
      payload?.Data?.ExternalTransactionId?.toString().trim() || null;

    if (!clientReference) {
      this.logger.warn(
        `Hubtel direct-receive callback rejected: missing ClientReference (schoolId=${schoolId})`,
      );
      throw new BadRequestException('Missing ClientReference');
    }

    const transaction =
      await this.paymentsService.findTransactionByClientReference(
        clientReference,
      );
    if (!transaction) {
      this.logger.warn(
        `Hubtel direct-receive callback: no transaction for ClientReference=${clientReference} schoolId=${schoolId}`,
      );
      throw new BadRequestException('Unknown ClientReference');
    }

    if (transaction.school.id !== schoolId) {
      this.logger.warn(
        `Hubtel direct-receive callback: school mismatch — pathSchoolId=${schoolId} txnSchoolId=${transaction.school?.id} clientReference=${clientReference}`,
      );
      throw new BadRequestException('School mismatch for ClientReference');
    }

    const eventKey = createHash('sha256')
      .update(
        `hubtel-direct-receive:${clientReference}:${transactionIdFromHubtel ?? ''}:${responseCode}`,
      )
      .digest('hex');
    const event = await this.paymentsService.createProviderEvent({
      eventType: 'hubtel_direct_receive_callback',
      eventKey,
      sessionId: clientReference,
      orderId: payload?.Data?.OrderId ?? null,
      payload: payload as unknown as Record<string, unknown>,
    });

    if (!event.created) {
      this.logger.log(
        `Hubtel direct-receive callback: duplicate ignored clientReference=${clientReference} eventKey=${eventKey}`,
      );
      return { ok: true, duplicate: true, status: transaction.status };
    }

    const outcome = mapHubtelResponseCode(
      responseCode,
      payload?.Message ?? null,
    );

    const charges =
      typeof payload?.Data?.Charges === 'number'
        ? Math.max(0, payload.Data.Charges)
        : 0;

    const updated =
      await this.paymentsService.updateTransactionStatusFromHubtel({
        sessionId: clientReference,
        orderId: payload?.Data?.OrderId ?? null,
        status: outcome.status,
        providerStatus:
          outcome.kind === 'failed'
            ? outcome.reason
            : (payload?.Message ?? null),
        hubtelTransactionId: transactionIdFromHubtel,
        networkTransactionId: externalTxnId,
        paymentMethod: 'mobilemoney',
        paymentDate: payload?.Data?.PaymentDate
          ? new Date(payload.Data.PaymentDate)
          : new Date(),
        amount: payload?.Data?.Amount ?? transaction.amount,
        charges,
        amountAfterCharges:
          payload?.Data?.AmountAfterCharges ?? transaction.amount,
        rawFulfilmentPayload: payload as unknown as Record<string, unknown>,
      });

    if (outcome.kind === 'paid') {
      await this.paymentsService.allocatePaidTransaction(updated.id);
    }

    await this.paymentsService.markProviderEventProcessed(event.record.id);

    this.logger.log(
      `Hubtel direct-receive callback: processed schoolId=${schoolId} clientReference=${clientReference} responseCode=${responseCode} mappedStatus=${outcome.status}`,
    );

    return {
      ok: true,
      duplicate: false,
      status: outcome.status,
    };
  }
}
