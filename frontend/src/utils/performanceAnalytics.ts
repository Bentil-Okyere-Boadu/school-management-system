type SchoolWithPerformanceFlag = {
  performanceAnalyticsEnabled?: boolean;
} | null | undefined;

/** Hide analytics nav/routes until school context is loaded (avoids enabled flash). */
export function isPerformanceAnalyticsEnabled(
  school: SchoolWithPerformanceFlag,
  options?: { isLoading?: boolean },
): boolean {
  if (options?.isLoading) return false;
  return school?.performanceAnalyticsEnabled ?? true;
}

/** Use for redirects/tab guards once loading has finished. */
export function isPerformanceAnalyticsEnabledResolved(
  school: SchoolWithPerformanceFlag,
): boolean {
  return school?.performanceAnalyticsEnabled ?? true;
}

export function isPerformanceAnalyticsRoute(pathname: string, role: "admin" | "teacher") {
  const base = `/${role}/performance-analytics`;
  return pathname === base || pathname.startsWith(`${base}/`);
}
