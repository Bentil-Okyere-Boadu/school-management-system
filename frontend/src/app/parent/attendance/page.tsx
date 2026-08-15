"use client";

import FullPageSpinner from "@/components/common/FullPageSpinner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ParentAttendanceRedirect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", "attendance");
    const query = next.toString();
    router.replace(query ? `/parent?${query}` : "/parent?tab=attendance");
  }, [router, searchParams]);

  return <FullPageSpinner />;
};

export default ParentAttendanceRedirect;
