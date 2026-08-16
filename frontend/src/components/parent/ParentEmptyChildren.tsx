"use client";

import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import React from "react";

export const ParentEmptyChildren: React.FC<{ message?: string }> = ({
  message,
}) => {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <NoAvailableEmptyState
        message={
          message ??
          "No active children yet. Confirm any pending child invitations from your email."
        }
      />
    </div>
  );
};
