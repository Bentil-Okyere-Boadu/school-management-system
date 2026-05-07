import { HubtelMobileMoneyChannel } from './dto/initiate-receive-money.dto';

// Map Hubtel USSD `Operator` strings (case-insensitive) to a Direct Receive
// Money channel. Hubtel emits brand variants e.g. MTN, AIRTELTIGO, AT,
// TELECEL, VODAFONE.
const OPERATOR_LOOKUP: Record<string, HubtelMobileMoneyChannel> = {
  MTN: HubtelMobileMoneyChannel.MTN,
  MTNGH: HubtelMobileMoneyChannel.MTN,
  AIRTELTIGO: HubtelMobileMoneyChannel.AIRTELTIGO,
  AT: HubtelMobileMoneyChannel.AIRTELTIGO,
  TIGO: HubtelMobileMoneyChannel.AIRTELTIGO,
  AIRTEL: HubtelMobileMoneyChannel.AIRTELTIGO,
  TELECEL: HubtelMobileMoneyChannel.TELECEL,
  VODAFONE: HubtelMobileMoneyChannel.TELECEL,
};

// MSISDN prefix -> channel. Accepts numbers in international (233...) or
// local (0...) format. Two-digit network code is what we match on.
const MSISDN_PREFIX_LOOKUP: Record<string, HubtelMobileMoneyChannel> = {
  '24': HubtelMobileMoneyChannel.MTN,
  '54': HubtelMobileMoneyChannel.MTN,
  '55': HubtelMobileMoneyChannel.MTN,
  '59': HubtelMobileMoneyChannel.MTN,
  '20': HubtelMobileMoneyChannel.TELECEL,
  '50': HubtelMobileMoneyChannel.TELECEL,
  '26': HubtelMobileMoneyChannel.AIRTELTIGO,
  '56': HubtelMobileMoneyChannel.AIRTELTIGO,
  '27': HubtelMobileMoneyChannel.AIRTELTIGO,
  '57': HubtelMobileMoneyChannel.AIRTELTIGO,
};

export function resolveHubtelChannelFromUssd(
  operator: string | null | undefined,
  msisdn: string | null | undefined,
): HubtelMobileMoneyChannel | null {
  const operatorKey = (operator ?? '').replace(/[^A-Za-z]/g, '').toUpperCase();
  if (operatorKey && OPERATOR_LOOKUP[operatorKey]) {
    return OPERATOR_LOOKUP[operatorKey];
  }

  const digits = (msisdn ?? '').replace(/\D/g, '');
  let networkCode: string | null = null;
  if (digits.startsWith('233') && digits.length >= 5) {
    networkCode = digits.slice(3, 5);
  } else if (digits.startsWith('0') && digits.length >= 3) {
    networkCode = digits.slice(1, 3);
  } else if (digits.length >= 2) {
    networkCode = digits.slice(0, 2);
  }

  if (networkCode && MSISDN_PREFIX_LOOKUP[networkCode]) {
    return MSISDN_PREFIX_LOOKUP[networkCode];
  }

  return null;
}
