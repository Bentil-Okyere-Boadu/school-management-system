/**
 * Builds the Receive Money primary callback URL Hubtel POSTs to for a school.
 * Must match the route registered on HubtelDirectReceiveController.
 *
 * `callbackBaseUrl` is typically `HUBTEL_PRIMARY_CALLBACK_BASE_URL` (includes
 * global prefix e.g. https://api.example.com/api/v1).
 */
export function buildReceiveMoneyPrimaryCallbackUrl(
  callbackBaseUrl: string | undefined | null,
  schoolId: string,
): string | null {
  const base = callbackBaseUrl?.trim().replace(/\/$/, '');
  if (!base) {
    return null;
  }
  return `${base}/integrations/hubtel/receive-money/callback/${encodeURIComponent(
    schoolId,
  )}`;
}
