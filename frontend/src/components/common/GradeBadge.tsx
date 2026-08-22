"use client";

import React from "react";
import { gradeCircleClass } from "@/utils/gradeDisplay";

type Props = {
  grade?: string | null;
  size?: "sm" | "md";
  className?: string;
};

export const GradeBadge: React.FC<Props> = ({
  grade,
  size = "md",
  className = "",
}) => {
  const display = grade?.trim() || "—";
  const sizeClass =
    size === "sm"
      ? "h-7 w-7 text-[10px]"
      : "h-8 w-8 text-xs";

  if (!grade?.trim()) {
    return <span className={`text-sm text-zinc-400 ${className}`}>—</span>;
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white ${sizeClass} ${gradeCircleClass(grade)} ${className}`}
      title={display}
    >
      {display}
    </span>
  );
};
