import {
  Calendar,
  ErrorResponse,
  FinanceFeeLine,
  FinanceStudentDetailTotals,
  PaginatedSchoolPaymentsResponse,
  SchoolPaymentReceiptDetail,
  SchoolPaymentTransaction,
  StudentResultsResponse,
  User,
} from "@/@types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { customAPI } from "../../config/setup";

export type ParentChild = {
  id: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  classLevels?: Array<{ id: string; name: string }>;
};

export type ParentMe = User & {
  children?: ParentChild[];
};

export type ParentOverviewWard = {
  studentId: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  grade: string | null;
  photoUrl: string | null;
  feesCharged: number;
  totalPaid: number;
  outstanding: number;
  nextDueDate: string | null;
  overdue: boolean;
};

export type ParentOverview = {
  parentName: string;
  schoolName: string | null;
  childrenCount: number;
  overdueChildrenCount: number;
  feesCharged: number;
  totalPaid: number;
  outstanding: number;
  pendingActionsCount: number;
  year: string | null;
  term: string | null;
  wards: ParentOverviewWard[];
};

export type ParentAttendanceDay = {
  day: number;
  date: string;
  status: "present" | "absent" | "none" | "weekend" | "holiday";
};

export type ParentAttendanceChild = {
  studentId: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  grade: string | null;
  photoUrl: string | null;
  daysRecorded: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  month: number;
  year: number;
  days: ParentAttendanceDay[];
};

export type ParentAnnouncement = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

export type ParentRequiredAction = {
  id: string;
  type: "child_confirmation" | string;
  message: string;
  status: string;
};

export type ParentAcademicsChild = {
  studentId: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  grade: string | null;
  photoUrl: string | null;
  resultsPending: boolean;
  results: StudentResultsResponse | null;
  announcements: ParentAnnouncement[];
  requiredActions: ParentRequiredAction[];
};

export type ParentFinanceUpcoming = {
  label: string;
  dueDate: string | null;
  amount: number;
  overdue: boolean;
};

export type ParentFinanceChild = {
  studentId: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  grade: string | null;
  photoUrl: string | null;
  feeLines: FinanceFeeLine[];
  totals: FinanceStudentDetailTotals;
  upcoming: ParentFinanceUpcoming[];
  history: SchoolPaymentTransaction[] | PaginatedSchoolPaymentsResponse;
};

export type ParentPaymentChannel = "mtn-gh" | "vodafone-gh" | "tigo-gh";

export type ParentInitiatePaymentPayload = {
  children: Array<{ studentId: string; amount: number }>;
  mobileNumber: string;
  channel: ParentPaymentChannel;
  customerName?: string;
  customerEmail?: string;
};

export type ParentInitiatePaymentResponse = {
  otpRequestId: string;
  expiresAt: string;
  total: number;
  allocations: Array<{ studentId: string; amount: number }>;
  message: string;
};

export type ParentVerifyPaymentResponse = {
  clientReference: string;
  status: string;
  message: string;
  allocations: Array<{
    studentId: string;
    sessionId: string;
    status: string;
    amount: number;
    transactionId: string;
  }>;
};

export type ParentPaymentStatus = {
  clientReference: string;
  status: string;
  amount: number;
  paymentDate: string | null;
};

export function getParentApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  const axiosError = error as AxiosError<ErrorResponse["response"]["data"]>;
  const message = axiosError?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}

export function isParentChildAccessError(error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status;
  return status === 403 || status === 404;
}

function optionalParams(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const useParentGetMe = () => {
  const { data, isLoading, isPending, error, refetch } = useQuery({
    queryKey: ["parent-me"],
    queryFn: () => customAPI.get("/parent/me"),
    refetchOnWindowFocus: true,
  });

  const me = data?.data as ParentMe | undefined;
  const children = me?.children ?? [];

  return { me, children, isLoading, isPending, error, refetch };
};

export const useParentCalendars = (enabled = true) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["parent-calendars"],
    queryFn: () => customAPI.get("/parent/calendars"),
    enabled,
  });

  const calendars = (data?.data as Calendar[]) ?? [];
  return { calendars, isLoading, refetch };
};

export const useParentOverview = (
  params: { studentId?: string; calendarId?: string; termId?: string },
  enabled = true,
) => {
  const { studentId, calendarId, termId } = params;
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["parent-overview", studentId, calendarId, termId],
    queryFn: () =>
      customAPI.get(
        `/parent/overview${optionalParams({ studentId, calendarId, termId })}`,
      ),
    enabled,
    retry: (failureCount, error) =>
      !isParentChildAccessError(error) && failureCount < 2,
  });

  return {
    overview: data?.data as ParentOverview | undefined,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

export const useParentAttendance = (
  params: { studentId?: string; month: number; year: number },
  enabled = true,
) => {
  const { studentId, month, year } = params;
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["parent-attendance", studentId, month, year],
    queryFn: () =>
      customAPI.get(
        `/parent/attendance${optionalParams({ studentId, month, year })}`,
      ),
    enabled,
    retry: (failureCount, error) =>
      !isParentChildAccessError(error) && failureCount < 2,
  });

  const rows = data?.data;
  const attendance: ParentAttendanceChild[] = Array.isArray(rows)
    ? rows
    : rows
      ? [rows as ParentAttendanceChild]
      : [];

  return { attendance, isLoading, isFetching, error, refetch };
};

export const useParentAcademics = (
  params: { calendarId?: string; studentId?: string },
  enabled = true,
) => {
  const { calendarId, studentId } = params;
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["parent-academics", calendarId, studentId],
    queryFn: () =>
      customAPI.get(
        `/parent/academics${optionalParams({ calendarId, studentId })}`,
      ),
    enabled: enabled && Boolean(calendarId),
    retry: (failureCount, error) =>
      !isParentChildAccessError(error) && failureCount < 2,
  });

  const rows = data?.data;
  const academics: ParentAcademicsChild[] = Array.isArray(rows)
    ? rows
    : rows
      ? [rows as ParentAcademicsChild]
      : [];

  return { academics, isLoading, isFetching, error, refetch };
};

export const useParentFinance = (studentId?: string, enabled = true) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["parent-finance", studentId],
    queryFn: () =>
      customAPI.get(`/parent/finance${optionalParams({ studentId })}`),
    enabled,
    retry: (failureCount, error) =>
      !isParentChildAccessError(error) && failureCount < 2,
  });

  const rows = data?.data;
  const finance: ParentFinanceChild[] = Array.isArray(rows)
    ? rows
    : rows
      ? [rows as ParentFinanceChild]
      : [];

  return { finance, isLoading, isFetching, error, refetch };
};

export const useParentPaymentReceipt = (
  studentId: string | null,
  transactionId: string | null,
  enabled: boolean,
) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["parent-payment-receipt", studentId, transactionId],
    queryFn: () =>
      customAPI.get(
        `/parent/children/${encodeURIComponent(studentId as string)}/receipts/${encodeURIComponent(transactionId as string)}`,
      ),
    enabled: Boolean(studentId) && Boolean(transactionId) && enabled,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) =>
      !isParentChildAccessError(error) && failureCount < 2,
  });

  return {
    receipt: data?.data as SchoolPaymentReceiptDetail | undefined,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

export const useParentInitiatePayment = () => {
  return useMutation({
    mutationFn: (payload: ParentInitiatePaymentPayload) =>
      customAPI.post("/parent/payments/initiate", payload),
  });
};

export const useParentVerifyPayment = () => {
  return useMutation({
    mutationFn: (payload: { otpRequestId: string; otp: string }) =>
      customAPI.post("/parent/payments/verify-and-pay", payload),
  });
};

export const useParentPaymentStatus = (
  clientReference: string | null,
  enabled: boolean,
) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["parent-payment-status", clientReference],
    queryFn: () =>
      customAPI.get(
        `/parent/payments/status/${encodeURIComponent(clientReference as string)}`,
      ),
    enabled: Boolean(clientReference) && enabled,
    refetchInterval: (query) => {
      const status = (query.state.data?.data as ParentPaymentStatus | undefined)
        ?.status;
      if (status === "PAID" || status === "FAILED" || status === "CANCELLED") {
        return false;
      }
      return 3000;
    },
  });

  return {
    status: data?.data as ParentPaymentStatus | undefined,
    isLoading,
    isFetching,
  };
};

export const useConfirmParentChild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) =>
      customAPI.post(`/parent/relationships/${linkId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-me"] });
      queryClient.invalidateQueries({ queryKey: ["parent-overview"] });
      queryClient.invalidateQueries({ queryKey: ["parent-academics"] });
    },
  });
};
