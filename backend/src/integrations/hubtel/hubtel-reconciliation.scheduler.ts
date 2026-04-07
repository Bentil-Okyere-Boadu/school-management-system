import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HubtelStatusService } from './hubtel-status.service';
import { PaymentsService } from 'src/payments/payments.service';
import { PaymentTransactionStatus } from 'src/payments/entities/payment-transaction.entity';

@Injectable()
export class HubtelReconciliationScheduler {
  private readonly logger = new Logger(HubtelReconciliationScheduler.name);
  private running = false;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly hubtelStatusService: HubtelStatusService,
  ) {}

  @Cron(process.env.HUBTEL_STATUS_RECONCILE_CRON ?? '0 */5 * * * *')
  async reconcilePendingTransactions() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const staleTransactions =
        await this.paymentsService.getStalePendingTransactions(5);

      for (const transaction of staleTransactions) {
        try {
          const statusResponse =
            await this.hubtelStatusService.checkTransactionStatus(
              transaction.sessionId,
            );
          await this.paymentsService.markStatusCheck(transaction.id);
          if (!statusResponse?.data) {
            continue;
          }

          const status = String(statusResponse.data.status).toLowerCase();
          const mappedStatus =
            status === 'paid'
              ? PaymentTransactionStatus.PAID
              : status === 'refunded'
                ? PaymentTransactionStatus.REFUNDED
                : PaymentTransactionStatus.UNPAID;

          const updated =
            await this.paymentsService.updateTransactionStatusFromHubtel({
              sessionId: transaction.sessionId,
              status: mappedStatus,
              providerStatus: statusResponse.data.status,
              hubtelTransactionId: statusResponse.data.transactionId,
              networkTransactionId: statusResponse.data.externalTransactionId,
              paymentMethod: statusResponse.data.paymentMethod,
              paymentDate: statusResponse.data.date
                ? new Date(statusResponse.data.date)
                : null,
              amount: statusResponse.data.amount,
              charges: statusResponse.data.charges,
              amountAfterCharges: statusResponse.data.amountAfterCharges,
            });

          if (mappedStatus === PaymentTransactionStatus.PAID) {
            await this.paymentsService.allocatePaidTransaction(updated.id);
          }
        } catch (error) {
          this.logger.warn(
            `Failed reconciling transaction ${transaction.id}: ${String(error)}`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
