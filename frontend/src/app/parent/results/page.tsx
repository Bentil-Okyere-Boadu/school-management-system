"use client";

import FullPageSpinner from "@/components/common/FullPageSpinner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ParentResultsRedirect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("tab");
    const query = next.toString();
    router.replace(query ? `/parent?${query}` : "/parent");
  }, [router, searchParams]);

  return <FullPageSpinner />;
};

export default ParentResultsRedirect;
