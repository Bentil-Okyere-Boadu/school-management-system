"use client";

import { ALL_CHILDREN_VALUE } from "@/components/parent/parent-utils";
import { isParentChildAccessError, useParentGetMe } from "@/hooks/parent";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

export function useParentPageFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { me, children, isLoading, error } = useParentGetMe();

  const studentIdParam = searchParams.get("studentId") ?? "";
  const selectedStudentId = useMemo(() => {
    if (!studentIdParam) return ALL_CHILDREN_VALUE;
    if (children.some((child) => child.id === studentIdParam)) {
      return studentIdParam;
    }
    return ALL_CHILDREN_VALUE;
  }, [children, studentIdParam]);

  const apiStudentId =
    selectedStudentId === ALL_CHILDREN_VALUE ? undefined : selectedStudentId;

  const replaceParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === ALL_CHILDREN_VALUE) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setStudentId = useCallback(
    (studentId: string) => {
      replaceParams({ studentId });
    },
    [replaceParams],
  );

  useEffect(() => {
    if (!studentIdParam || isLoading) return;
    if (children.some((child) => child.id === studentIdParam)) return;
    replaceParams({ studentId: undefined });
  }, [children, isLoading, replaceParams, studentIdParam]);

  const handleChildAccessError = useCallback(
    (queryError: unknown) => {
      if (!isParentChildAccessError(queryError)) return;
      replaceParams({ studentId: undefined });
    },
    [replaceParams],
  );

  return {
    me,
    children,
    isLoading,
    error,
    selectedStudentId,
    apiStudentId,
    searchParams,
    replaceParams,
    setStudentId,
    handleChildAccessError,
  };
}
