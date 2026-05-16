export type PaymentConfigStatus = 'ready' | 'paused' | 'not_onboarded';

export const PAYMENT_CONFIG_STATUS = {
  READY: 'ready',
  PAUSED: 'paused',
  NOT_ONBOARDED: 'not_onboarded',
} as const satisfies Record<string, PaymentConfigStatus>;

export interface SchoolPaymentConfig {
  status: PaymentConfigStatus;
  canInitiatePayment: boolean;
  /** ISO 8601 when a school admin last requested payment setup; null if never. */
  paymentSetupRequestSentAt: string | null;
  hasRequestedPaymentSetup: boolean;
}
