"use client";

import FullPageSpinner from "@/components/common/FullPageSpinner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ParentPaymentsRedirect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", "finance");
    const query = next.toString();
    router.replace(query ? `/parent?${query}` : "/parent?tab=finance");
  }, [router, searchParams]);

  return <FullPageSpinner />;
};

export default ParentPaymentsRedirect;
