import { PaymentTransactionStatus } from 'src/payments/entities/payment-transaction.entity';

export const HUBTEL_RESPONSE_CODE_DESCRIPTIONS: Record<string, string> = {
  '0000': 'Transaction processed successfully',
  '0001': 'Request accepted; awaiting final state via callback',
  '2001':
    'Customer-side failure (insufficient funds, wrong PIN, timeout, or invalid number)',
  '4000': 'Validation errors on the request payload',
  '4070':
    'Fees not configured for the given conditions; check minimum amount or fee setup',
  '4101':
    'Business not fully set up to receive payments; check API keys, scopes, and Collection Account Number',
  '4103': 'Permission denied; account not allowed to transact on this channel',
};

const MERCHANT_CONFIG_ERROR_CODES = new Set(['4070', '4101', '4103']);

export type HubtelOutcome =
  | { kind: 'paid'; status: PaymentTransactionStatus.PAID }
  | { kind: 'pending'; status: PaymentTransactionStatus.PENDING }
  | {
      kind: 'failed';
      status: PaymentTransactionStatus.FAILED;
      isMerchantConfig: boolean;
      reason: string;
    };

export function mapHubtelResponseCode(
  responseCode: string | number | null | undefined,
  fallbackMessage?: string | null,
): HubtelOutcome {
  const code = String(responseCode ?? '').trim();
  const description =
    HUBTEL_RESPONSE_CODE_DESCRIPTIONS[code] ??
    fallbackMessage ??
    `Unknown Hubtel response code ${code || '(empty)'}`;

  if (code === '0000') {
    return { kind: 'paid', status: PaymentTransactionStatus.PAID };
  }
  if (code === '0001') {
    return { kind: 'pending', status: PaymentTransactionStatus.PENDING };
  }

  return {
    kind: 'failed',
    status: PaymentTransactionStatus.FAILED,
    isMerchantConfig: MERCHANT_CONFIG_ERROR_CODES.has(code),
    reason: description,
  };
}
