import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HubtelStatusService } from './hubtel-status.service';
import { PaymentsService } from 'src/payments/payments.service';
import { PaymentTransactionStatus } from 'src/payments/entities/payment-transaction.entity';

/**
 * Periodically checks the status of stale PENDING transactions via Hubtel's
 * Transaction Status API. Each check uses the per-school credentials of the
 * transaction's owning school. Transactions belonging to schools without an
 * active Hubtel merchant configuration are skipped.
 */
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

      if (staleTransactions.length > 0) {
        this.logger.log(
          `Hubtel reconciliation: checking ${staleTransactions.length} stale pending transaction(s)`,
        );
      }

      let skippedNoMerchant = 0;
      for (const transaction of staleTransactions) {
        const school = transaction.school;
        if (!school || !school.hubtelMerchantActive) {
          skippedNoMerchant += 1;
          continue;
        }

        try {
          const statusResponse =
            await this.hubtelStatusService.checkTransactionStatus(school, {
              sessionId: transaction.sessionId,
              hubtelTransactionId: transaction.hubtelTransactionId,
              networkTransactionId: transaction.networkTransactionId,
            });
          await this.paymentsService.markStatusCheck(transaction.id);
          if (!statusResponse?.data) {
            this.logger.warn(
              `Hubtel reconciliation: no status from Hubtel for transaction ${transaction.id} schoolId=${school.id} sessionId=${transaction.sessionId} (hubtelTxnId=${transaction.hubtelTransactionId ?? 'none'} networkTxnId=${transaction.networkTransactionId ?? 'none'})`,
            );
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

          this.logger.log(
            `Hubtel reconciliation: success transactionId=${updated.id} schoolId=${school.id} sessionId=${transaction.sessionId} mappedStatus=${mappedStatus} providerStatus=${statusResponse.data.status} hubtelTransactionId=${statusResponse.data.transactionId ?? 'n/a'} networkTransactionId=${statusResponse.data.externalTransactionId ?? 'n/a'}`,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          const stack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Hubtel reconciliation: failed transactionId=${transaction.id} schoolId=${school.id} sessionId=${transaction.sessionId}: ${message}`,
            stack,
          );
        }
      }

      if (skippedNoMerchant > 0) {
        this.logger.log(
          `Hubtel reconciliation: skipped ${skippedNoMerchant} stale transaction(s) for schools without an active Hubtel merchant`,
        );
      }
    } finally {
      this.running = false;
    }
  }
}
