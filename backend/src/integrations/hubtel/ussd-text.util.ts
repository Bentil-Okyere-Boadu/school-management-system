/**
 * Pure helpers for Hubtel / GSM USSD copy: length limits, amounts, and safe text.
 */

export const USSD_MESSAGE_MAX_LENGTH = 178;

/** Ensures the full USSD screen text fits provider limits (default 178 chars). */
export function truncateToUssdLimit(
  text: string,
  maxLength: number = USSD_MESSAGE_MAX_LENGTH,
): string {
  const normalized = text.replace(/\r/g, '');
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3)}...`;
}

/**
 * Shortens a label for narrow USSD columns. If truncated, ends with "." so it
 * reads as an intentional ellipsis, not a typo.
 */
export function truncateWithEllipsis(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, maxChars - 1))}.`;
}

/** Compact display for GHS amounts on USSD (integers without decimals). */
export function formatGhsAmount(amount: number): string {
  if (Number.isInteger(amount)) {
    return String(amount);
  }
  const formatted = amount.toFixed(2).replace(/\.?0+$/, '');
  return formatted || '0';
}

/** Parses user-entered money (commas allowed); null if not a finite number. */
export function parseAmountFromUserInput(raw: string): number | null {
  const parsed = Number(String(raw).replace(/,/g, '').trim());
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

/** Printable ASCII + newline only — avoids broken encoding on some handsets. */
export function stripNonAsciiForUssd(text: string): string {
  return text.replace(/[^\x20-\x7E\n]/g, '');
}

export type UssdAllocationPreviewLine = { feeName: string; amount: number };

const PREVIEW_MAX_FEE_ROWS = 3;
const PREVIEW_FEE_NAME_MAX_CHARS = 12;

/**
 * Multi-line confirmation body: amount, student name, up to three allocation
 * lines, optional "+more", and Yes/No prompt.
 */
export function buildUssdPaymentPreviewBody(
  paymentAmountGhs: number,
  studentDisplayName: string,
  allocationLines: UssdAllocationPreviewLine[],
): string {
  const lines: string[] = [
    `Pay GHS ${formatGhsAmount(paymentAmountGhs)}`,
    studentDisplayName,
    'Applies:',
  ];
  const positiveLines = allocationLines.filter((row) => row.amount > 0);
  const visibleRows = positiveLines.slice(0, PREVIEW_MAX_FEE_ROWS);
  for (const row of visibleRows) {
    lines.push(
      `${truncateWithEllipsis(row.feeName, PREVIEW_FEE_NAME_MAX_CHARS)}:${formatGhsAmount(row.amount)}`,
    );
  }
  if (allocationLines.length > PREVIEW_MAX_FEE_ROWS) {
    lines.push('+more');
  }
  lines.push('1=Yes 2=No');
  return lines.join('\n');
}

export function buildShortStudentDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  maxChars = 18,
): string {
  const fullName =
    `${(firstName ?? '').trim()} ${(lastName ?? '').trim()}`.trim();
  return truncateWithEllipsis(fullName || 'Student', maxChars);
}
