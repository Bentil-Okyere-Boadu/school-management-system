export type PaymentConfigStatus = 'ready' | 'paused' | 'not_onboarded';

export const PAYMENT_CONFIG_STATUS = {
  READY: 'ready',
  PAUSED: 'paused',
  NOT_ONBOARDED: 'not_onboarded',
} as const satisfies Record<string, PaymentConfigStatus>;

export interface SchoolPaymentConfig {
  status: PaymentConfigStatus;
  canInitiatePayment: boolean;
}
