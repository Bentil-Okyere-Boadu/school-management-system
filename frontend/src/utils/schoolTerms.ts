import type { Calendar, Term } from "@/@types";

/**
 * All school terms across calendars, deduped by id, newest first
 * (by startDate, then endDate) — same ordering as admin classes term filter.
 */
export function getSortedSchoolTerms(
  calendars: Calendar[] | undefined | null,
): Term[] {
  const seen = new Set<string>();
  const flat: Term[] = [];
  for (const cal of calendars ?? []) {
    for (const t of cal.terms ?? []) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      flat.push(t);
    }
  }
  return flat.sort((a, b) => {
    const da = a.startDate ? new Date(a.startDate).getTime() : NaN;
    const db = b.startDate ? new Date(b.startDate).getTime() : NaN;
    if (!Number.isNaN(da) && !Number.isNaN(db) && da !== db) {
      return db - da;
    }
    const ea = a.endDate ? new Date(a.endDate).getTime() : NaN;
    const eb = b.endDate ? new Date(b.endDate).getTime() : NaN;
    if (!Number.isNaN(ea) && !Number.isNaN(eb) && ea !== eb) {
      return eb - ea;
    }
    return 0;
  });
}

/** Calendar id that contains the given term, or empty string. */
export function findCalendarIdForTerm(
  calendars: Calendar[] | undefined | null,
  termId: string,
): string {
  if (!termId || !calendars?.length) return "";
  for (const cal of calendars) {
    if (cal.terms?.some((t) => String(t.id) === String(termId))) {
      return String(cal.id);
    }
  }
  return "";
}

/** Options for term selects: `Term name — Calendar name` when a calendar is found. */
export function buildTermSelectData(
  calendars: Calendar[],
  sortedTerms: Term[],
): { value: string; label: string }[] {
  return sortedTerms.map((t) => {
    const cal = calendars.find((c) =>
      c.terms?.some((term) => term.id === t.id),
    );
    const label = cal ? `${t.termName} — ${cal.name}` : t.termName;
    return { value: t.id, label };
  });
}

/** Human-readable label for a stored term id (or legacy name/id string). */
export function getTermLabel(
  calendars: Calendar[] | undefined | null,
  termId: string | null | undefined,
  emptyLabel = "All terms",
): string {
  if (!termId?.trim()) return emptyLabel;
  const sorted = getSortedSchoolTerms(calendars);
  const match = buildTermSelectData(calendars ?? [], sorted).find(
    (opt) => opt.value === termId,
  );
  if (match) return match.label;
  const byName = sorted.find((t) => t.termName === termId);
  if (byName) {
    const cal = calendars?.find((c) =>
      c.terms?.some((term) => term.id === byName.id),
    );
    return cal ? `${byName.termName} — ${cal.name}` : byName.termName;
  }
  return termId;
}
