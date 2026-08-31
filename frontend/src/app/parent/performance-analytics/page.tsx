"use client";

import FullPageSpinner from "@/components/common/FullPageSpinner";
import { useParentGetMe } from "@/hooks/parent";
import { isPerformanceAnalyticsEnabledResolved } from "@/utils/performanceAnalytics";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ParentPerformanceAnalyticsRedirect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { me, isLoading } = useParentGetMe();

  useEffect(() => {
    if (isLoading) return;
    const next = new URLSearchParams(searchParams.toString());
    if (isPerformanceAnalyticsEnabledResolved(me?.school)) {
      next.set("tab", "analytics");
    } else {
      next.delete("tab");
    }
    const query = next.toString();
    router.replace(query ? `/parent?${query}` : "/parent");
  }, [isLoading, me?.school, router, searchParams]);

  return <FullPageSpinner />;
};

export default ParentPerformanceAnalyticsRedirect;

