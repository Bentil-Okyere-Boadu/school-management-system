"use client";

import { PaymentReceipt } from "@/components/admin/payments/PaymentReceipt";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ParentPaymentReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = params.transactionId as string;
  const studentId = searchParams.get("studentId");

  useEffect(() => {
    if (!studentId) {
      router.replace("/parent?tab=finance");
    }
  }, [router, studentId]);

  if (!studentId) return null;

  return (
    <PaymentReceipt
      transactionId={transactionId}
      open
      variant="page"
      parentPortal
      studentId={studentId}
      onClose={() => router.push("/parent?tab=finance")}
    />
  );
}
