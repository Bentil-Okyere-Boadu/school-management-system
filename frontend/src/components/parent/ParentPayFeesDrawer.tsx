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
import { formatParentDate, fullName, getInitials, normalizeGhanaMsisdn } from "./parent-utils";
import { IconCheck, IconReceipt, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

const CHANNEL_OPTIONS = [
  { value: "mtn-gh", label: "MTN" },
  { value: "vodafone-gh", label: "Telecel" },
  { value: "tigo-gh", label: "AirtelTigo" },
];

type PayStep = "select" | "details" | "otp" | "status";

interface ParentPayFeesDrawerProps {
  open: boolean;
  onClose: () => void;
  finance: ParentFinanceChild[];
  parentName?: string;
  parentEmail?: string;
}

export const ParentPayFeesDrawer: React.FC<ParentPayFeesDrawerProps> = ({
  open,
  onClose,
  finance,
  parentName,
  parentEmail,
}) => {
  const queryClient = useQueryClient();
  const payableChildren = useMemo(
    () => finance.filter((child) => (child.totals?.outstanding ?? 0) > 0),
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
  const initializedRef = useRef(false);
  const statusToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      statusToastRef.current = null;
      return;
    }
    if (initializedRef.current || payableChildren.length === 0) return;
    initializedRef.current = true;
    const defaults = Object.fromEntries(
      payableChildren.map((child) => [
        child.studentId,
        (child.totals.outstanding ?? 0).toFixed(2),
      ]),
    );
    setStep("select");
    setSelectedIds(payableChildren.slice(0, 1).map((child) => child.studentId));
    setAmounts(defaults);
    setMobileNumber("");
    setChannel("mtn-gh");
    setOtp("");
    setOtpRequestId(null);
    setClientReference(null);
  }, [open, payableChildren]);

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

  const handleInitiate = async () => {
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
      childrenPayload.some(
        (child) => !Number.isFinite(child.amount) || child.amount < 0.5,
      )
    ) {
      toast.error("Each selected ward must be at least GHS 0.50.");
      return;
    }

    try {
      const response = await initiatePayment.mutateAsync({
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
              Money is applied only to the wards you select below.
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
          {payableChildren.length === 0 && (
            <p className="text-sm text-zinc-500">
              None of your wards have an outstanding balance.
            </p>
          )}

          {step === "select" && (
            <ul className="space-y-3">
              {payableChildren.map((child) => {
                const selected = selectedIds.includes(child.studentId);
                return (
                  <li key={child.studentId}>
                    <button
                      type="button"
                      onClick={() => toggleChild(child.studentId)}
                      className={`w-full rounded-xl border px-4 py-3 text-left cursor-pointer ${
                        selected
                          ? "border-teal-200 bg-teal-50"
                          : "border-zinc-200 bg-white"
                      }`}
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
                          {formatGHSCurrency(child.totals.outstanding)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {step === "details" && (
            <div className="space-y-4">
              {selectedChildren.map((child) => (
                <InputField
                  key={child.studentId}
                  label={`Amount for ${fullName(child.firstName, child.lastName)}`}
                  type="number"
                  min={0.5}
                  max={child.totals.outstanding}
                  step="0.01"
                  value={amounts[child.studentId] ?? ""}
                  onChange={(event) =>
                    setAmounts((current) => ({
                      ...current,
                      [child.studentId]: event.target.value,
                    }))
                  }
                />
              ))}
              <InputField
                label="Mobile money number"
                placeholder="233XXXXXXXXX"
                value={mobileNumber}
                onChange={(event) => setMobileNumber(event.target.value)}
              />
              <div>
                <p className="mb-1.5 text-xs text-zinc-600">Network</p>
                <CustomSelectTag
                  options={CHANNEL_OPTIONS}
                  value={channel}
                  onOptionItemClick={(event) =>
                    setChannel(event.target.value as ParentPaymentChannel)
                  }
                />
              </div>
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
              onClick={() => {}} // TODO: disabled for NOW
              disabled={selectedChildren.length === 0}
              className="w-full max-sm:w-full"
            />
          )}
          {step === "details" && (
            <CustomButton
              text={`Confirm payment of ${formatGHSCurrency(total)}`}
              onClick={handleInitiate}
              loading={initiatePayment.isPending}
              disabled={selectedChildren.length === 0}
              className="w-full max-sm:w-full"
            />
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
              text="Done"
              onClick={onClose}
              className="w-full max-sm:w-full"
            />
          )}
          <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <IconReceipt size={14} />
            You receive a receipt per ward immediately after payment.
          </p>
        </div>
      </aside>
    </div>
  );
};
