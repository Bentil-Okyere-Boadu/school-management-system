"use client";

import { useParentPageFilters } from "@/components/parent/useParentPageFilters";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const ParentPerformanceAnalyticsRedirect = () => {
  const router = useRouter();
  const { searchParams } = useParentPageFilters();

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", "academics");
    const query = next.toString();
    router.replace(query ? `/parent?${query}` : "/parent?tab=academics");
  }, [router, searchParams]);

  return null;
};

export default ParentPerformanceAnalyticsRedirect;
