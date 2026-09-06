"use client";

import CustomButton from "@/components/Button";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import { ParentAttendanceTab } from "@/components/parent/ParentAttendanceTab";
import { ParentEmptyChildren } from "@/components/parent/ParentEmptyChildren";
import { ParentFilters } from "@/components/parent/ParentFilters";
import { ParentFinanceTab } from "@/components/parent/ParentFinanceTab";
import { ParentKpiRow } from "@/components/parent/ParentKpiRow";
import { ParentPayFeesDrawer } from "@/components/parent/ParentPayFeesDrawer";
import { ParentPerformanceAnalyticsTab } from "@/components/parent/ParentPerformanceAnalyticsTab";
import { ParentPillTabBar, ParentTabItem } from "@/components/parent/ParentPillTabBar";
import {
  pickAttendancePeriod,
  pickCurrentCalendar,
  pickCurrentTerm,
} from "@/components/parent/parent-utils";
import { useParentPageFilters } from "@/components/parent/useParentPageFilters";
import {
  getParentApiErrorMessage,
  isParentChildAccessError,
  useParentAttendance,
  useParentCalendars,
  useParentFinance,
  useParentOverview,
  useParentPerformanceAnalytics,
} from "@/hooks/parent";
import { IconWallet } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { HashLoader } from "react-spinners";
import React, { useEffect, useMemo, useState } from "react";
import {
  isPerformanceAnalyticsEnabled,
  isPerformanceAnalyticsEnabledResolved,
} from "@/utils/performanceAnalytics";

/** Temporarily hidden on Family Dashboard; keep implementation for a future release. */
const PARENT_ACADEMICS_TAB_ENABLED = false;

const BASE_FAMILY_TABS: ParentTabItem[] = [
  { tabLabel: "Attendance", tabKey: "attendance" },
  { tabLabel: "Finance", tabKey: "finance" },
  ...(PARENT_ACADEMICS_TAB_ENABLED
    ? [{ tabLabel: "Academics", tabKey: "academics" }]
    : []),
];

const ParentDashboard = () => {
  const router = useRouter();
  const now = new Date();
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

  const tabFromUrl = searchParams.get("tab") ?? "";

  const isTabFromUrlValid = useMemo(() => {
    if (!tabFromUrl) return false;
    if (BASE_FAMILY_TABS.some((tab) => tab.tabKey === tabFromUrl)) return true;
    if (tabFromUrl === "analytics") {
      if (childrenLoading) return true;
      return isPerformanceAnalyticsEnabledResolved(me?.school);
    }
    return false;
  }, [childrenLoading, me?.school, tabFromUrl]);

  const familyTabs = useMemo(
    () => [
      ...BASE_FAMILY_TABS,
      ...(performanceAnalyticsEnabled ||
      (childrenLoading && tabFromUrl === "analytics")
        ? [{ tabLabel: "Academics", tabKey: "analytics" }]
        : []),
    ],
    [childrenLoading, performanceAnalyticsEnabled, tabFromUrl],
  );

  const activeTabKey = isTabFromUrlValid ? tabFromUrl : "attendance";
  const hasChildren = children.length > 0;

  const { calendars } = useParentCalendars(true);
  const calendarId = searchParams.get("calendarId") ?? "";
  const termId = searchParams.get("termId") ?? "";
  const month = Number(searchParams.get("month") ?? NaN);
  const year = Number(searchParams.get("year") ?? NaN);

  const [payOpen, setPayOpen] = useState(false);
  const [preselectStudentId, setPreselectStudentId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (tabFromUrl === "analytics" && childrenLoading) {
      return;
    }

    if (
      tabFromUrl === "analytics" &&
      !isPerformanceAnalyticsEnabledResolved(me?.school)
    ) {
      replaceParams({ tab: "attendance" });
      return;
    }

    if (tabFromUrl === "academics" && !PARENT_ACADEMICS_TAB_ENABLED) {
      replaceParams({ tab: "attendance" });
      return;
    }

    if (!calendars.length) {
      if (!isTabFromUrlValid) {
        replaceParams({ tab: "attendance" });
      }
      return;
    }
    const current = pickCurrentCalendar(calendars);
    const nextCalendarId = calendarId || current?.id || "";
    const calendar =
      calendars.find((item) => item.id === nextCalendarId) ?? current;
    const nextTerm = calendar?.terms?.find((term) => term.id === termId)
      ?? pickCurrentTerm(calendar);
    const nextTermId = termId || nextTerm?.id || "";
    const period = pickAttendancePeriod(nextTerm);
    const nextMonth = Number.isFinite(month) ? month : period.month;
    const nextYear = Number.isFinite(year) ? year : period.year;

    if (
      nextCalendarId === calendarId &&
      nextTermId === termId &&
      nextMonth === month &&
      nextYear === year &&
      isTabFromUrlValid
    ) {
      return;
    }

    replaceParams({
      tab: isTabFromUrlValid ? tabFromUrl : "attendance",
      calendarId: nextCalendarId || undefined,
      termId: nextTermId || undefined,
      month: String(nextMonth),
      year: String(nextYear),
    });
  }, [calendarId, calendars, childrenLoading, isTabFromUrlValid, me?.school, month, replaceParams, searchParams, tabFromUrl, termId, year]);

  const { overview, isLoading: overviewLoading, error: overviewError } =
    useParentOverview(
      {
        studentId: apiStudentId,
        calendarId: calendarId || undefined,
        termId: termId || undefined,
      },
      hasChildren && Boolean(termId),
    );

  const attendanceMonth = Number.isFinite(month) ? month : now.getMonth() + 1;
  const attendanceYear = Number.isFinite(year) ? year : now.getFullYear();

  const { attendance, isLoading: attendanceLoading, error: attendanceError } =
    useParentAttendance(
      {
        studentId: apiStudentId,
        month: attendanceMonth,
        year: attendanceYear,
      },
      hasChildren && activeTabKey === "attendance",
    );

  const { finance, isLoading: financeLoading, error: financeError } =
    useParentFinance(
      apiStudentId,
      hasChildren && Boolean(termId),
      {
        academicCalendarId: calendarId || undefined,
        academicTermId: termId || undefined,
      },
    );

  const {
    performanceAnalytics,
    isLoading: performanceAnalyticsLoading,
    error: performanceAnalyticsError,
  } = useParentPerformanceAnalytics(
    { academicTermId: termId || undefined, studentId: apiStudentId },
    hasChildren &&
      activeTabKey === "analytics" &&
      performanceAnalyticsEnabled &&
      Boolean(termId),
  );

  useEffect(() => {
    handleChildAccessError(overviewError);
    handleChildAccessError(attendanceError);
    handleChildAccessError(financeError);
    handleChildAccessError(performanceAnalyticsError);
  }, [
    attendanceError,
    financeError,
    handleChildAccessError,
    overviewError,
    performanceAnalyticsError,
  ]);

  const performanceAnalyticsErrorMessage =
    performanceAnalyticsError &&
    !isParentChildAccessError(performanceAnalyticsError)
      ? getParentApiErrorMessage(
          performanceAnalyticsError,
          "Unable to load performance analytics.",
        )
      : null;

  const calendarOptions = calendars.map((calendar) => ({
    value: calendar.id,
    label: calendar.name,
  }));
  const selectedCalendar = calendars.find((calendar) => calendar.id === calendarId);
  const termOptions = (selectedCalendar?.terms ?? []).map((term) => ({
    value: term.id,
    label: term.termName,
  }));
  const selectedTerm = selectedCalendar?.terms?.find((term) => term.id === termId);

  const subtitle = [
    `${children.length} ward${children.length === 1 ? "" : "s"} linked to your account`,
    selectedCalendar?.name,
    selectedTerm?.termName,
  ]
    .filter(Boolean)
    .join(" · ");

  const openPay = (studentId?: string) => {
    setPreselectStudentId(studentId ?? null);
    setPayOpen(true);
  };

  const hasOutstanding = finance.some(
    (child) => (child.totals?.outstanding ?? 0) > 0,
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Family overview</h2>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        <CustomButton
          text="Pay fees"
          icon={<IconWallet size={16} />}
          onClick={() => openPay()}
          disabled={!hasOutstanding || financeLoading}
          className="print:hidden py-[4px] px-[8px]"
        />
      </div>

      <ParentFilters
        wards={children}
        selectedStudentId={selectedStudentId}
        onStudentChange={setStudentId}
        calendarOptions={calendarOptions}
        selectedCalendarId={calendarId}
        onCalendarChange={(value) => {
          const nextCalendar = calendars.find((calendar) => calendar.id === value);
          const nextTerm = pickCurrentTerm(nextCalendar);
          const period = pickAttendancePeriod(nextTerm);
          replaceParams({
            calendarId: value,
            termId: nextTerm?.id,
            month: String(period.month),
            year: String(period.year),
          });
        }}
        termOptions={termOptions}
        selectedTermId={termId}
        onTermChange={(value) => {
          const nextTerm = selectedCalendar?.terms?.find((term) => term.id === value);
          const period = pickAttendancePeriod(nextTerm);
          replaceParams({
            termId: value,
            month: String(period.month),
            year: String(period.year),
          });
        }}
      />

      {overviewLoading && !overview ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <HashLoader color="#AB58E7" size={40} />
        </div>
      ) : (
        <>
          {(overview?.pendingActionsCount ?? 0) > 0 && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              An extra child confirmation is waiting. Check your email and use
              the confirm-child link to finish linking them.
            </div>
          )}

          <ParentKpiRow overview={overview} termName={selectedTerm?.termName} />

          {children.length === 0 ? (
            <ParentEmptyChildren />
          ) : (
            <>
              <ParentPillTabBar
                items={familyTabs}
                activeTabKey={activeTabKey}
                onItemClick={(item) => replaceParams({ tab: item.tabKey })}
                trackClassName="rounded-xl px-2 py-1.5"
                itemClassName="rounded-md px-3 py-1 !text-[15px]"
              />

              {activeTabKey === "attendance" && (
                <ParentAttendanceTab
                  childrenCount={children.length}
                  childrenLoading={childrenLoading}
                  attendance={attendance}
                  isLoading={attendanceLoading}
                  term={selectedTerm}
                  onPeriodChange={(nextMonth, nextYear) =>
                    replaceParams({
                      month: String(nextMonth),
                      year: String(nextYear),
                    })
                  }
                />
              )}

              {activeTabKey === "finance" && (
                <ParentFinanceTab
                  childrenCount={children.length}
                  childrenLoading={childrenLoading}
                  finance={finance}
                  isLoading={financeLoading}
                  onPay={openPay}
                  onReceipt={(studentId, transactionId) =>
                    router.push(
                      `/parent/payments/receipt/${transactionId}?studentId=${studentId}`,
                    )
                  }
                />
              )}

              {activeTabKey === "analytics" && performanceAnalyticsEnabled && (
                performanceAnalyticsErrorMessage ? (
                  <NoAvailableEmptyState message={performanceAnalyticsErrorMessage} />
                ) : (
                  <ParentPerformanceAnalyticsTab
                    childrenCount={children.length}
                    childrenLoading={childrenLoading}
                    performanceAnalytics={performanceAnalytics}
                    isLoading={performanceAnalyticsLoading}
                    calendars={calendars}
                    selectedTermId={termId}
                    onTermChange={(value) => {
                      const nextTerm = selectedCalendar?.terms?.find(
                        (term) => term.id === value,
                      );
                      const period = pickAttendancePeriod(nextTerm);
                      replaceParams({
                        termId: value,
                        month: String(period.month),
                        year: String(period.year),
                      });
                    }}
                  />
                )
              )}
            </>
          )}
        </>
      )}

      <ParentPayFeesDrawer
        open={payOpen}
        onClose={() => {
          setPayOpen(false);
          setPreselectStudentId(null);
        }}
        finance={finance}
        calendars={calendars}
        calendarId={calendarId}
        termId={termId}
        preselectStudentId={preselectStudentId}
        parentName={`${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim()}
        parentEmail={me?.email}
        onCalendarChange={(value) => {
          const nextCalendar = calendars.find((calendar) => calendar.id === value);
          const nextTerm = pickCurrentTerm(nextCalendar);
          const period = pickAttendancePeriod(nextTerm);
          replaceParams({
            calendarId: value,
            termId: nextTerm?.id,
            month: String(period.month),
            year: String(period.year),
          });
        }}
        onTermChange={(value) => {
          const nextTerm = selectedCalendar?.terms?.find((term) => term.id === value);
          const period = pickAttendancePeriod(nextTerm);
          replaceParams({
            termId: value,
            month: String(period.month),
            year: String(period.year),
          });
        }}
      />
    </div>
  );
};

export default ParentDashboard;
