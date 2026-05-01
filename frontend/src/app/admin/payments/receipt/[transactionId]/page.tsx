"use client";

import { PaymentReceipt } from "@/components/admin/payments/PaymentReceipt";
import { useParams, useRouter } from "next/navigation";

export default function AdminPaymentReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.transactionId as string;

  return (
    <PaymentReceipt
      transactionId={transactionId}
      open
      variant="page"
      onClose={() => router.push("/admin/payments")}
    />
  );
}
