/** Round a percentage value to a whole number (0–100 scale). */
export function roundPercent(value: number): number {
  return Math.round(value);
}

/** Format a percentage for display, e.g. `63%`. */
export function formatPercent(
  value: number | null | undefined,
  fallback = "—",
): string {
  if (value === null || value === undefined) return fallback;
  return `${roundPercent(value)}%`;
}

/** Format a min–max percentage range, e.g. `45%–82%`. */
export function formatPercentRange(
  min: number | null,
  max: number | null,
  fallback = "—",
): string {
  if (min === null || max === null) return fallback;
  return `${roundPercent(min)}%–${roundPercent(max)}%`;
}
