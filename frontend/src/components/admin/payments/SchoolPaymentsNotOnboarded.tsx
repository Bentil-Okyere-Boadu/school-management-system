"use client";

import type { SchoolPaymentConfig } from "@/@types";
import { useRequestPaymentSetup } from "@/hooks/school-admin";
import {
  IconCircleCheck,
  IconCreditCard,
  IconMail,
  IconSparkles,
} from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const CHECKLIST: string[] = [
  "Get a unique school billing code (SBC)",
  "Enable USSD short-code collections",
  "Issue receipts and reconcile payouts",
];

export type SchoolPaymentsNotOnboardedProps = {
  defaultContactEmail?: string;
  paymentConfig: SchoolPaymentConfig | undefined;
};

export const SchoolPaymentsNotOnboarded: React.FC<
  SchoolPaymentsNotOnboardedProps
> = ({ defaultContactEmail = "", paymentConfig }) => {
  const hasRequestedFromServer = Boolean(
    paymentConfig?.hasRequestedPaymentSetup
  );
  const [showFormOverride, setShowFormOverride] = useState(false);

  const showSuccess = hasRequestedFromServer && !showFormOverride;
  const showForm = !hasRequestedFromServer || showFormOverride;

  const [contactEmail, setContactEmail] = useState("");
  const [note, setNote] = useState("");
  const requestSetup = useRequestPaymentSetup();

  useEffect(() => {
    setContactEmail((prev) => (prev ? prev : defaultContactEmail));
  }, [defaultContactEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestSetup.mutate(
      {
        contactEmail: contactEmail.trim() || undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowFormOverride(false);
          setNote("");
          toast.success(
            "Request sent. The super admin team has been notified by email."
          );
        },
        onError: (err: unknown) => {
          const msg =
            err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "data" in err.response &&
            err.response.data &&
            typeof err.response.data === "object" &&
            "message" in err.response.data
            ? String(
                (err.response.data as { message?: string | string[] }).message
              )
            : "Could not send request. Try again later.";
          toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
        },
      }
    );
  };

  if (showSuccess) {
    return (
      <div className="overflow-hidden rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50 via-emerald-50/80 to-white p-8 sm:p-10">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <IconCircleCheck size={32} stroke={2} aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-zinc-900">
            Request sent
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            The super admin has been notified by email. We&apos;ll get back to
            you within 1–2 business days to walk through onboarding.
          </p>
          <button
            type="button"
            onClick={() => setShowFormOverride(true)}
            className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
          >
            Send another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-0">
        <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden bg-gradient-to-br from-violet-100 via-violet-50 to-white lg:col-span-5 lg:min-h-[380px]">
          <span
            className="pointer-events-none absolute -left-8 top-10 h-28 w-28 rounded-full bg-violet-200/40 blur-2xl"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-8 right-4 h-24 w-24 rounded-full bg-violet-300/30 blur-xl"
            aria-hidden
          />
          <IconSparkles
            className="pointer-events-none absolute left-[12%] top-[18%] text-violet-300/80"
            size={20}
            stroke={1.25}
            aria-hidden
          />
          <IconSparkles
            className="pointer-events-none absolute bottom-[22%] left-[20%] text-violet-200/90"
            size={14}
            stroke={1.25}
            aria-hidden
          />
          <IconSparkles
            className="pointer-events-none absolute right-[14%] top-[26%] text-violet-200/80"
            size={16}
            stroke={1.25}
            aria-hidden
          />

          <div className="relative z-[1] flex flex-col items-center gap-4 px-8 py-10">
            <div className="relative">
              <div className="flex h-28 w-36 items-center justify-center rounded-2xl border border-white/80 bg-white/95 shadow-lg shadow-violet-200/50">
                <IconMail
                  className="text-violet-500"
                  size={52}
                  stroke={1.25}
                  aria-hidden
                />
              </div>
              <div className="absolute -bottom-3 -right-5 flex h-16 w-24 items-center justify-center rounded-xl border border-violet-200 bg-gradient-to-br from-[#AB58E7] to-violet-700 text-white shadow-md">
                <IconCreditCard size={30} stroke={1.25} aria-hidden />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-zinc-100 p-6 sm:p-8 lg:col-span-7 lg:border-l lg:border-t-0 lg:p-10">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-violet-800">
            <IconSparkles size={14} stroke={1.75} className="shrink-0" />
            Action required
          </div>

          <div>
            <h2 className="text-2xl font-medium leading-tight tracking-tight text-zinc-900 sm:text-[1.65rem]">
              Payments not enabled for your school
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Your school hasn&apos;t been onboarded for payments yet. Submit a
              setup request below and the platform team will follow up with you.
            </p>
          </div>

          <ul className="space-y-3">
            {CHECKLIST.map((line) => (
              <li key={line} className="flex gap-3 text-sm text-zinc-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <IconCircleCheck size={16} stroke={2} aria-hidden />
                </span>
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmit} className="mt-1 flex flex-col gap-4">
            <div>
              <label htmlFor="school-payment-setup-email" className="sr-only">
                Contact email (optional)
              </label>
              <input
                id="school-payment-setup-email"
                type="email"
                autoComplete="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Contact email (optional)"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label htmlFor="school-payment-setup-note" className="sr-only">
                Note for super admin (optional)
              </label>
              <textarea
                id="school-payment-setup-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the super admin (optional)"
                rows={4}
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <button
              type="submit"
              disabled={requestSetup.isPending}
              className="inline-flex w-full items-center justify-center gap-2 cursor-pointer rounded-xl bg-[#AB58E7] px-2 py-2.5 text-sm font-semibold text-white  transition hover:bg-[#9a4dd4] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <IconMail size={18} stroke={1.75} aria-hidden />
              {requestSetup.isPending ? "Sending…" : "Request payment setup"}
            </button>
          </form>

          <p className="text-center text-xs leading-relaxed text-zinc-500">
            An email will be sent to the platform super admin team.
          </p>
        </div>
      </div>
    </div>
  );
};
