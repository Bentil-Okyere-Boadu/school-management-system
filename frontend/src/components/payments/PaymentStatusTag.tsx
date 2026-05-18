"use client";

import {
  IconAlertCircle,
  IconCircleCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import React, { useMemo } from "react";
import type { PaymentConfigStatus } from "@/@types";
import { useGetSchoolPaymentConfig } from "@/hooks/school-admin";
import { useGetStudentPaymentConfig } from "@/hooks/student";

const STATUS_LABELS: Record<PaymentConfigStatus, string> = {
  ready: "Ready",
  paused: "Paused",
  not_onboarded: "Not onboarded",
};

function StatusGlyph({
  status,
  size = 19,
}: Readonly<{ status: PaymentConfigStatus; size?: number }>) {
  switch (status) {
    case "ready":
      return (
        <span
          className="text-emerald-600"
          aria-hidden
        >
          <IconCircleCheck size={size} stroke={1.75} />
        </span>
      );
    case "paused":
      return (
        <span
          className="text-amber-600"
          aria-hidden
        >
          <IconAlertTriangle size={size} stroke={1.75} />
        </span>
      );
    default:
      return (
        <span
          className="text-zinc-500"
          aria-hidden
        >
          <IconAlertCircle size={size} stroke={1.75} />
        </span>
      );
  }
}

type PaymentStatusTagInnerProps = {
  status: PaymentConfigStatus;
  isLoading: boolean;
  /** Screen reader / prefix text, e.g. "Payments" */
  labelPrefix: string;
};

function PaymentStatusTagInner({
  status,
  isLoading,
  labelPrefix,
}: Readonly<PaymentStatusTagInnerProps>) {
  const text = useMemo(() => STATUS_LABELS[status], [status]);

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900"
      role="status"
      aria-busy={isLoading}
      aria-label={
        isLoading
          ? `${labelPrefix} status loading`
          : `${labelPrefix} status: ${text}`
      }
    >
      {!isLoading && <StatusGlyph status={status} />}
      <span className="tabular-nums">
        {isLoading ? `${labelPrefix}: …` : `${labelPrefix}: ${text}`}
      </span>
    </div>
  );
}

/** Header tag for signed-in students (`/payments/me/config`). */
export const StudentPaymentStatusTag: React.FC = () => {
  const { config, isLoading } = useGetStudentPaymentConfig();
  const status: PaymentConfigStatus = config?.status ?? "not_onboarded";
  return (
    <PaymentStatusTagInner
      status={status}
      isLoading={isLoading}
      labelPrefix="Payments"
    />
  );
};

/** Header tag for school admins (`/payments/my-school/config`). */
export const SchoolAdminPaymentStatusTag: React.FC = () => {
  const { config, isLoading } = useGetSchoolPaymentConfig();
  const status: PaymentConfigStatus = config?.status ?? "not_onboarded";
  return (
    <PaymentStatusTagInner
      status={status}
      isLoading={isLoading}
      labelPrefix="Payments"
    />
  );
};
