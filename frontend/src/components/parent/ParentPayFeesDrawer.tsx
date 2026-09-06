"use client";

import { formatGHSCurrency } from "@/components/admin/payments/paymentUtils";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import {
  getParentApiErrorMessage,
  useParentInitiatePayment,
  useParentPaymentStatus,
  useParentVerifyPayment,
  type ParentFinanceChild,
  type ParentPaymentChannel,
} from "@/hooks/parent";
import type { Calendar } from "@/@types";
import {
  formatParentDate,
  fullName,
  getInitials,
  normalizeGhanaMsisdn,
  pickCurrentTerm,
  termOutstanding,
} from "./parent-utils";
import { MomoNetworkPicker } from "./MomoNetworkPicker";
import { IconCheck, IconReceipt, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

type PayStep = "select" | "details" | "otp" | "status";

interface ParentPayFeesDrawerProps {
  open: boolean;
  onClose: () => void;
  finance: ParentFinanceChild[];
  calendars: Calendar[];
  calendarId?: string;
  termId?: string;
  preselectStudentId?: string | null;
  parentName?: string;
  parentEmail?: string;
  onCalendarChange?: (calendarId: string) => void;
  onTermChange?: (termId: string) => void;
}

export const ParentPayFeesDrawer: React.FC<ParentPayFeesDrawerProps> = ({
  open,
  onClose,
  finance,
  calendars,
  calendarId,
  termId,
  preselectStudentId,
  parentName,
  parentEmail,
  onCalendarChange,
  onTermChange,
}) => {
  const queryClient = useQueryClient();
  const selectedCalendar =
    calendars.find((calendar) => calendar.id === calendarId) ?? calendars[0];
  const selectedTerm =
    selectedCalendar?.terms?.find((term) => term.id === termId) ??
    pickCurrentTerm(selectedCalendar);
  const activeTermId = selectedTerm?.id ?? termId ?? "";

  const payableChildren = useMemo(
    () => finance.filter((child) => termOutstanding(child) > 0),
    [finance],
  );

  const [step, setStep] = useState<PayStep>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [mobileNumber, setMobileNumber] = useState("");
  const [channel, setChannel] = useState<ParentPaymentChannel>("mtn-gh");
  const [otp, setOtp] = useState("");
  const [otpRequestId, setOtpRequestId] = useState<string | null>(null);
  const [clientReference, setClientReference] = useState<string | null>(null);

  const initiatePayment = useParentInitiatePayment();
  const verifyPayment = useParentVerifyPayment();
  const { status } = useParentPaymentStatus(
    clientReference,
    open && step === "status" && Boolean(clientReference),
  );
  const initializedKeyRef = useRef<string | null>(null);
  const statusToastRef = useRef<string | null>(null);
  const canChangePeriod = step === "select" || step === "details";

  const calendarOptions = calendars.map((calendar) => ({
    value: calendar.id,
    label: calendar.name,
  }));
  const termOptions = (selectedCalendar?.terms ?? []).map((term) => ({
    value: term.id,
    label: term.termName,
  }));

  useEffect(() => {
    if (!open) {
      initializedKeyRef.current = null;
      statusToastRef.current = null;
      return;
    }
    const initKey = `${activeTermId}:${payableChildren
      .map((child) => child.studentId)
      .join(",")}`;
    if (initializedKeyRef.current === initKey) return;
    if (
      initializedKeyRef.current &&
      (step === "otp" || step === "status")
    ) {
      return;
    }
    initializedKeyRef.current = initKey;

    const defaults = Object.fromEntries(
      payableChildren.map((child) => [
        child.studentId,
        termOutstanding(child).toFixed(2),
      ]),
    );
    const preferred =
      preselectStudentId &&
      payableChildren.some((child) => child.studentId === preselectStudentId)
        ? [preselectStudentId]
        : payableChildren.slice(0, 1).map((child) => child.studentId);

    setStep("select");
    setSelectedIds(preferred);
    setAmounts(defaults);
    setOtp("");
    setOtpRequestId(null);
    setClientReference(null);
  }, [
    activeTermId,
    open,
    payableChildren,
    preselectStudentId,
    step,
  ]);

  useEffect(() => {
    if (step !== "status" || !status?.status) return;
    if (statusToastRef.current === status.status) return;
    statusToastRef.current = status.status;
    if (status.status === "PAID") {
      toast.success("Payment processed successfully.");
      queryClient.invalidateQueries({ queryKey: ["parent-finance"] });
      queryClient.invalidateQueries({ queryKey: ["parent-overview"] });
    }
    if (status.status === "FAILED" || status.status === "CANCELLED") {
      toast.error("Payment did not complete. Please try again.");
    }
  }, [queryClient, status?.status, step]);

  if (!open) return null;

  const selectedChildren = payableChildren.filter((child) =>
    selectedIds.includes(child.studentId),
  );
  const total = selectedChildren.reduce((sum, child) => {
    const amount = Number(amounts[child.studentId] ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const toggleChild = (studentId: string) => {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  };

  const selectAll = () => {
    setSelectedIds(payableChildren.map((child) => child.studentId));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleInitiate = async () => {
    if (!activeTermId) {
      toast.error("Select a term before paying.");
      return;
    }
    const msisdn = normalizeGhanaMsisdn(mobileNumber);
    if (!/^233\d{9}$/.test(msisdn)) {
      toast.error("Enter a valid Ghana mobile number, e.g. 233XXXXXXXXX.");
      return;
    }
    const childrenPayload = selectedChildren.map((child) => ({
      studentId: child.studentId,
      amount: Number(Number(amounts[child.studentId]).toFixed(2)),
    }));
    if (
      childrenPayload.some((child) => {
        const max = termOutstanding(
          payableChildren.find((row) => row.studentId === child.studentId)!,
        );
        return (
          !Number.isFinite(child.amount) ||
          child.amount < 0.5 ||
          child.amount > max + 0.001
        );
      })
    ) {
      toast.error("Enter between GHS 0.50 and this term's outstanding for each selected ward.");
      return;
    }

    try {
      const response = await initiatePayment.mutateAsync({
        academicTermId: activeTermId,
        children: childrenPayload,
        mobileNumber: msisdn,
        channel,
        customerName: parentName,
        customerEmail: parentEmail,
      });
      const data = response.data;
      setOtpRequestId(data.otpRequestId);
      setStep("otp");
      toast.success(data.message || "OTP sent.");
    } catch (error) {
      toast.error(getParentApiErrorMessage(error, "Unable to start payment."));
    }
  };

  const handleVerify = async () => {
    if (!otpRequestId) return;
    if (!/^\d{4,8}$/.test(otp.trim())) {
      toast.error("Enter the 4–8 digit OTP sent to your phone.");
      return;
    }
    try {
      const response = await verifyPayment.mutateAsync({
        otpRequestId,
        otp: otp.trim(),
      });
      const data = response.data;
      setClientReference(data.clientReference);
      setStep("status");
      toast.success(data.message || "MoMo prompt sent.");
      queryClient.invalidateQueries({ queryKey: ["parent-finance"] });
      queryClient.invalidateQueries({ queryKey: ["parent-overview"] });
    } catch (error) {
      toast.error(getParentApiErrorMessage(error, "Unable to verify payment."));
    }
  };

  const paid = status?.status === "PAID";
  const failed =
    status?.status === "FAILED" || status?.status === "CANCELLED";
  const periodLabel = [selectedTerm?.termName, selectedCalendar?.name]
    .filter(Boolean)
    .join(" · ");

  const payAnotherWard = () => {
    statusToastRef.current = null;
    setClientReference(null);
    setOtpRequestId(null);
    setOtp("");
    setStep("select");
    initializedKeyRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end print:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close pay fees"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-[420px] flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Pay school fees</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {periodLabel
                ? `Paying for ${periodLabel}. Partial amounts are allowed.`
                : "Money is applied only to the wards you select below."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 cursor-pointer"
            aria-label="Close"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {calendarOptions.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <CustomSelectTag
                variant="outline"
                options={calendarOptions}
                value={selectedCalendar?.id}
                onOptionItemClick={(event) => {
                  if (!canChangePeriod) return;
                  onCalendarChange?.(event.target.value);
                }}
                selectClassName="!rounded-lg min-w-[160px]"
              />
              {termOptions.length > 0 && (
                <CustomSelectTag
                  variant="outline"
                  options={termOptions}
                  value={selectedTerm?.id}
                  onOptionItemClick={(event) => {
                    if (!canChangePeriod) return;
                    onTermChange?.(event.target.value);
                  }}
                  selectClassName="!rounded-lg min-w-[140px]"
                />
              )}
            </div>
          )}

          {payableChildren.length === 0 && step === "select" && (
            <p className="text-sm text-zinc-500">
              None of your wards have an outstanding balance for this term.
              Switch term to pay another period.
            </p>
          )}

          {step === "select" && payableChildren.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-500">
                  Select wards for this term
                </p>
                <button
                  type="button"
                  onClick={
                    selectedIds.length === payableChildren.length
                      ? clearSelection
                      : selectAll
                  }
                  className="text-xs font-medium text-purple-600 hover:text-purple-700 cursor-pointer"
                >
                  {selectedIds.length === payableChildren.length
                    ? "Clear"
                    : "Select all"}
                </button>
              </div>
              <ul className="space-y-3">
                {payableChildren.map((child) => {
                  const selected = selectedIds.includes(child.studentId);
                  const max = termOutstanding(child);
                  return (
                    <li key={child.studentId}>
                      <div
                        className={`rounded-xl border px-4 py-3 ${
                          selected
                            ? "border-teal-200 bg-teal-50"
                            : "border-zinc-200 bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleChild(child.studentId)}
                          className="w-full text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-teal-500 bg-teal-500 text-white"
                                  : "border-zinc-300 bg-white text-transparent"
                              }`}
                            >
                              <IconCheck size={14} />
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-sm font-semibold text-white">
                              {getInitials(child.firstName, child.lastName)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-neutral-800">
                                {fullName(child.firstName, child.lastName)}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {child.grade ?? "—"}
                                {child.totals.nextDueDate
                                  ? ` · Due ${formatParentDate(child.totals.nextDueDate)}`
                                  : ""}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-teal-600">
                              {formatGHSCurrency(max)}
                            </p>
                          </div>
                        </button>
                        {selected && (
                          <div className="mt-3 pl-9">
                            <InputField
                              label="Amount to pay"
                              type="number"
                              min={0.5}
                              max={max}
                              step="0.01"
                              value={amounts[child.studentId] ?? ""}
                              onChange={(event) =>
                                setAmounts((current) => ({
                                  ...current,
                                  [child.studentId]: event.target.value,
                                }))
                              }
                            />
                            <p className="-mt-2 text-xs text-zinc-500">
                              Max {formatGHSCurrency(max)} for this term. You can pay less.
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                {selectedChildren
                  .map(
                    (child) =>
                      `${fullName(child.firstName, child.lastName)} · ${formatGHSCurrency(
                        Number(amounts[child.studentId] ?? 0),
                      )}`,
                  )
                  .join(" · ")}
              </div>
              <InputField
                label="Mobile money number"
                placeholder="233XXXXXXXXX"
                value={mobileNumber}
                onChange={(event) => setMobileNumber(event.target.value)}
              />
              <MomoNetworkPicker value={channel} onChange={setChannel} />
            </div>
          )}

          {step === "otp" && (
            <div>
              <p className="mb-4 text-sm text-zinc-600">
                OTP sent. Enter it to confirm and trigger the MoMo prompt.
              </p>
              <InputField
                label="OTP"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="123456"
              />
            </div>
          )}

          {step === "status" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
              <p className="font-semibold text-neutral-800">
                {paid
                  ? "Payment received"
                  : failed
                    ? "Payment failed"
                    : "Approve the MoMo prompt on your phone"}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {status?.status
                  ? `Status: ${status.status}`
                  : "Waiting for confirmation…"}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 px-5 py-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-zinc-500">
              Total to pay · {selectedChildren.length} ward
              {selectedChildren.length === 1 ? "" : "s"} selected
            </span>
            <span className="font-semibold text-neutral-800">
              {formatGHSCurrency(total)}
            </span>
          </div>
          {step === "select" && (
            <CustomButton
              text={`Continue · ${formatGHSCurrency(total)}`}
              onClick={() => setStep("details")}
              disabled={selectedChildren.length === 0 || total < 0.5}
              className="w-full max-sm:w-full"
            />
          )}
          {step === "details" && (
            <div className="space-y-2">
              <CustomButton
                text={`Confirm payment of ${formatGHSCurrency(total)}`}
                onClick={handleInitiate}
                loading={initiatePayment.isPending}
                disabled={selectedChildren.length === 0}
                className="w-full max-sm:w-full"
              />
              <button
                type="button"
                onClick={() => setStep("select")}
                className="w-full text-center text-sm text-zinc-500 hover:text-zinc-700 cursor-pointer"
              >
                Back to ward selection
              </button>
            </div>
          )}
          {step === "otp" && (
            <CustomButton
              text="Verify OTP"
              onClick={handleVerify}
              loading={verifyPayment.isPending}
              className="w-full max-sm:w-full"
            />
          )}
          {step === "status" && (paid || failed) && (
            <CustomButton
              text={
                paid && payableChildren.length > 0
                  ? "Pay another ward"
                  : "Done"
              }
              onClick={
                paid && payableChildren.length > 0 ? payAnotherWard : onClose
              }
              className="w-full max-sm:w-full"
            />
          )}
          <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <IconReceipt size={14} />
            You receive a receipt per ward immediately after payment. Unpaid
            remainder stays on this term.
          </p>
        </div>
      </aside>
    </div>
  );
};
