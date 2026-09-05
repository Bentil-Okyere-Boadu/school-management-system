export type TermFilterContext = {
  termId: string;
  termStart: string;
  termEnd: string;
  calendarId: string | null;
};

export type PeriodScopedFeeLine = {
  academicTermId?: string | null;
  academicCalendarId?: string | null;
  periodStart?: string;
  periodEnd?: string;
  isArrear?: boolean;
  outstanding?: number;
};

export function periodsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export function lineMatchesTermFilter(
  line: PeriodScopedFeeLine,
  ctx: TermFilterContext,
): boolean {
  const outstanding = line.outstanding ?? 0;

  if (outstanding > 0 && line.isArrear) {
    return true;
  }

  if (
    outstanding > 0 &&
    line.academicTermId &&
    line.academicTermId !== ctx.termId &&
    line.periodEnd &&
    line.periodEnd < ctx.termStart
  ) {
    return true;
  }

  if (line.academicTermId === ctx.termId) {
    return true;
  }

  if (
    !line.academicTermId &&
    line.periodStart &&
    line.periodEnd &&
    ctx.calendarId &&
    line.academicCalendarId === ctx.calendarId &&
    periodsOverlap(
      line.periodStart,
      line.periodEnd,
      ctx.termStart,
      ctx.termEnd,
    )
  ) {
    return true;
  }

  if (outstanding > 0 && !line.academicTermId && !line.academicCalendarId) {
    return true;
  }

  return false;
}
