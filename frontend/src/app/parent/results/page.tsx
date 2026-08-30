"use client";

import FullPageSpinner from "@/components/common/FullPageSpinner";
import { useParentPageFilters } from "@/components/parent/useParentPageFilters";
import {
  isPerformanceAnalyticsEnabledResolved,
} from "@/utils/performanceAnalytics";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const ParentResultsRedirect = () => {
  const router = useRouter();
  const { me, searchParams, isLoading: childrenLoading } = useParentPageFilters();

  useEffect(() => {
    if (childrenLoading) return;

    const next = new URLSearchParams(searchParams.toString());

    if (isPerformanceAnalyticsEnabledResolved(me?.school)) {
      next.set("tab", "academics");
      const query = next.toString();
      router.replace(query ? `/parent?${query}` : "/parent?tab=academics");
      return;
    }

    next.delete("tab");
    const query = next.toString();
    router.replace(query ? `/parent?${query}` : "/parent");
  }, [childrenLoading, me?.school, router, searchParams]);

  return <FullPageSpinner />;
};

export default ParentResultsRedirect;
