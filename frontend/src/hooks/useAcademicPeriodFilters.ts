"use client";

import { useGetCalendars } from "@/hooks/school-admin";
import {
  findCalendarIdForTerm,
  getSortedSchoolTerms,
} from "@/utils/schoolTerms";
import { pickCurrentTerm } from "@/components/parent/parent-utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export type AcademicPeriodFilters = {
  calendarId: string;
  termId: string;
};

export function useAcademicPeriodFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { calendars, isLoading: calendarsLoading } = useGetCalendars();

  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(calendars),
    [calendars]
  );
  const latestTermId = sortedTerms[0]?.id ?? "";
  const latestCalendarId = latestTermId
    ? findCalendarIdForTerm(calendars, latestTermId)
    : calendars[0]?.id ?? "";

  const [calendarId, setCalendarId] = useState(
    () => searchParams.get("calendarId") ?? ""
  );
  const [termId, setTermId] = useState(
    () => searchParams.get("termId") ?? ""
  );

  const replacePeriodInUrl = useCallback(
    (next: AcademicPeriodFilters) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.calendarId) {
        params.set("calendarId", next.calendarId);
      } else {
        params.delete("calendarId");
      }
      if (next.termId) {
        params.set("termId", next.termId);
      } else {
        params.delete("termId");
      }
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (calendarsLoading || sortedTerms.length === 0) return;

    const urlCalendarId = searchParams.get("calendarId") ?? "";
    const urlTermId = searchParams.get("termId") ?? "";

    let nextCalendarId = urlCalendarId;
    let nextTermId = urlTermId;

    if (!nextTermId || !sortedTerms.some((term) => term.id === nextTermId)) {
      nextTermId = latestTermId;
    }
    if (!nextCalendarId || !calendars.some((cal) => cal.id === nextCalendarId)) {
      nextCalendarId =
        findCalendarIdForTerm(calendars, nextTermId) || latestCalendarId;
    }

    const termCalendarId = findCalendarIdForTerm(calendars, nextTermId);
    if (termCalendarId && nextCalendarId !== termCalendarId) {
      nextCalendarId = termCalendarId;
    }

    if (nextCalendarId !== calendarId || nextTermId !== termId) {
      setCalendarId(nextCalendarId);
      setTermId(nextTermId);
    }

    if (
      urlCalendarId !== nextCalendarId ||
      urlTermId !== nextTermId
    ) {
      replacePeriodInUrl({
        calendarId: nextCalendarId,
        termId: nextTermId,
      });
    }
  }, [
    calendarId,
    calendars,
    calendarsLoading,
    latestCalendarId,
    latestTermId,
    replacePeriodInUrl,
    searchParams,
    sortedTerms,
    termId,
  ]);

  const scopedTerms = useMemo(() => {
    if (!calendarId) return sortedTerms;
    const calendar = calendars.find((cal) => cal.id === calendarId);
    if (!calendar?.terms?.length) return sortedTerms;
    const allowed = new Set(calendar.terms.map((term) => term.id));
    return sortedTerms.filter((term) => allowed.has(term.id));
  }, [calendarId, calendars, sortedTerms]);

  const periodLabel = useMemo(() => {
    const term = sortedTerms.find((item) => item.id === termId);
    const calendar = calendars.find((item) => item.id === calendarId);
    if (!term) return "";
    return calendar ? `${term.termName} — ${calendar.name}` : term.termName;
  }, [calendarId, calendars, sortedTerms, termId]);

  const ready = !calendarsLoading && Boolean(termId);

  const setCalendar = useCallback(
    (nextCalendarId: string) => {
      const calendar = calendars.find((cal) => cal.id === nextCalendarId);
      const calendarTerms = getSortedSchoolTerms(calendar ? [calendar] : []);
      const nextTerm =
        pickCurrentTerm(calendar) ?? calendarTerms[0] ?? sortedTerms[0];
      const nextTermId = nextTerm?.id ?? "";
      setCalendarId(nextCalendarId);
      setTermId(nextTermId);
      replacePeriodInUrl({
        calendarId: nextCalendarId,
        termId: nextTermId,
      });
    },
    [calendars, replacePeriodInUrl, sortedTerms]
  );

  const setTerm = useCallback(
    (nextTermId: string) => {
      const nextCalendarId =
        findCalendarIdForTerm(calendars, nextTermId) || calendarId;
      setTermId(nextTermId);
      setCalendarId(nextCalendarId);
      replacePeriodInUrl({
        calendarId: nextCalendarId,
        termId: nextTermId,
      });
    },
    [calendarId, calendars, replacePeriodInUrl]
  );

  return {
    calendars,
    sortedTerms,
    scopedTerms,
    calendarId,
    termId,
    latestTermId,
    periodLabel,
    ready,
    calendarsLoading,
    setCalendar,
    setTerm,
  };
}
