"use client";

import { PaymentReceipt } from "@/components/admin/payments/PaymentReceipt";
import { useParams, useRouter } from "next/navigation";

export default function StudentPaymentReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.transactionId as string;

  return (
    <PaymentReceipt
      transactionId={transactionId}
      open
      variant="page"
      studentPortal
      onClose={() => router.push("/student/payments")}
    />
  );
}
