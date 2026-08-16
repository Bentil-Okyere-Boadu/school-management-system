"use client";

import FullPageSpinner from "@/components/common/FullPageSpinner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ParentResultsRedirect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", "academics");
    const query = next.toString();
    router.replace(query ? `/parent?${query}` : "/parent?tab=academics");
  }, [router, searchParams]);

  return <FullPageSpinner />;
};

export default ParentResultsRedirect;
