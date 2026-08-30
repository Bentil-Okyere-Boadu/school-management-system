"use client";

import { PerformanceAnalyticsHeaderBar } from "@/components/common/PerformanceAnalyticsHeaderBar";
import { ParentEmptyChildren } from "@/components/parent/ParentEmptyChildren";
import { ParentFilters } from "@/components/parent/ParentFilters";
import { ParentPerformanceAnalyticsTab } from "@/components/parent/ParentPerformanceAnalyticsTab";
import { pickAttendancePeriod } from "@/components/parent/parent-utils";
import { useParentPageFilters } from "@/components/parent/useParentPageFilters";
import {
  useParentCalendars,
  useParentPerformanceAnalytics,
  getParentApiErrorMessage,
  isParentChildAccessError,
} from "@/hooks/parent";
import {
  findCalendarIdForTerm,
  getSortedSchoolTerms,
} from "@/utils/schoolTerms";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import {
  isPerformanceAnalyticsEnabled,
  isPerformanceAnalyticsEnabledResolved,
} from "@/utils/performanceAnalytics";

const ParentPerformanceAnalyticsPage = () => {
  const router = useRouter();
  const {
    me,
    children,
    isLoading: childrenLoading,
    selectedStudentId,
    apiStudentId,
    setStudentId,
    searchParams,
    replaceParams,
    handleChildAccessError,
  } = useParentPageFilters();

  const performanceAnalyticsEnabled = isPerformanceAnalyticsEnabled(me?.school, {
    isLoading: childrenLoading,
  });
  const performanceAnalyticsResolved = isPerformanceAnalyticsEnabledResolved(
    me?.school,
  );

  const { calendars, isLoading: calendarsLoading } = useParentCalendars(true);
  const calendarId = searchParams.get("calendarId") ?? "";
  const termId = searchParams.get("termId") ?? "";
  const month = Number(searchParams.get("month") ?? NaN);
  const year = Number(searchParams.get("year") ?? NaN);
  const hasChildren = children.length > 0;

  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(calendars),
    [calendars],
  );

  const latestTermId = sortedTerms[0]?.id ?? "";

  useEffect(() => {
    if (childrenLoading) return;
    if (performanceAnalyticsResolved) return;
    router.replace("/parent");
  }, [childrenLoading, performanceAnalyticsResolved, router]);

  useEffect(() => {
    if (!calendars.length || !performanceAnalyticsEnabled) return;

    const validTermId = sortedTerms.some((term) => term.id === termId)
      ? termId
      : "";
    const nextTermId = validTermId || latestTermId;
    const nextCalendarId =
      findCalendarIdForTerm(calendars, nextTermId) || calendarId;

    const calendar = calendars.find((item) => item.id === nextCalendarId);
    const nextTerm =
      calendar?.terms?.find((term) => term.id === nextTermId) ??
      sortedTerms.find((term) => term.id === nextTermId);

    const period = pickAttendancePeriod(nextTerm);
    const nextMonth = Number.isFinite(month) ? month : period.month;
    const nextYear = Number.isFinite(year) ? year : period.year;

    if (
      nextCalendarId === calendarId &&
      nextTermId === termId &&
      nextMonth === month &&
      nextYear === year
    ) {
      return;
    }

    replaceParams({
      calendarId: nextCalendarId || undefined,
      termId: nextTermId || undefined,
      month: String(nextMonth),
      year: String(nextYear),
    });
  }, [
    calendarId,
    calendars,
    latestTermId,
    month,
    performanceAnalyticsEnabled,
    replaceParams,
    sortedTerms,
    termId,
    year,
  ]);

  const handleTermChange = (nextTermId: string) => {
    const nextCalendarId = findCalendarIdForTerm(calendars, nextTermId);
    const calendar = calendars.find((item) => item.id === nextCalendarId);
    const nextTerm = calendar?.terms?.find((term) => term.id === nextTermId);
    const period = pickAttendancePeriod(nextTerm);
    replaceParams({
      calendarId: nextCalendarId || undefined,
      termId: nextTermId,
      month: String(period.month),
      year: String(period.year),
    });
  };

  const {
    performanceAnalytics,
    isLoading: performanceAnalyticsLoading,
    error: performanceAnalyticsError,
  } = useParentPerformanceAnalytics(
    { academicTermId: termId || undefined, studentId: apiStudentId },
    hasChildren && performanceAnalyticsEnabled && Boolean(termId),
  );

  useEffect(() => {
    if (!isParentChildAccessError(performanceAnalyticsError)) return;
    handleChildAccessError(performanceAnalyticsError);
  }, [handleChildAccessError, performanceAnalyticsError]);

  const performanceAnalyticsErrorMessage =
    performanceAnalyticsError && !isParentChildAccessError(performanceAnalyticsError)
      ? getParentApiErrorMessage(
          performanceAnalyticsError,
          "Unable to load performance analytics.",
        )
      : null;

  if (!performanceAnalyticsEnabled && !childrenLoading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <ParentFilters
        wards={children}
        selectedStudentId={selectedStudentId}
        onStudentChange={setStudentId}
        showFilterHint={false}
      />

      <PerformanceAnalyticsHeaderBar
        calendars={calendars}
        calendarsLoading={calendarsLoading}
        sortedTerms={sortedTerms}
        selectedTermId={termId}
        onTermChange={handleTermChange}
        description="Read-only assignment outcomes by subject and topic for your linked child or children."
      />

      {children.length === 0 ? (
        childrenLoading ? null : <ParentEmptyChildren />
      ) : performanceAnalyticsErrorMessage ? (
        <NoAvailableEmptyState message={performanceAnalyticsErrorMessage} />
      ) : (
        <ParentPerformanceAnalyticsTab
          childrenCount={children.length}
          childrenLoading={childrenLoading}
          performanceAnalytics={performanceAnalytics}
          isLoading={performanceAnalyticsLoading}
          calendars={calendars}
          selectedTermId={termId}
          onTermChange={handleTermChange}
        />
      )}
    </div>
  );
};

export default ParentPerformanceAnalyticsPage;
