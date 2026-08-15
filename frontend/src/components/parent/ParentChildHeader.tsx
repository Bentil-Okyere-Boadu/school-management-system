"use client";

import { getInitials } from "./parent-utils";
import React from "react";

interface ParentChildHeaderProps {
  firstName?: string | null;
  lastName?: string | null;
  grade?: string | null;
  studentCode?: string | null;
  photoUrl?: string | null;
  actions?: React.ReactNode;
  divider?: boolean;
}

export const ParentChildHeader: React.FC<ParentChildHeaderProps> = ({
  firstName,
  lastName,
  grade,
  studentCode,
  photoUrl,
  actions,
  divider = false,
}) => {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Ward";
  const meta = [grade, studentCode].filter(Boolean).join(" · ");
  const initials = getInitials(firstName, lastName);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${
        divider ? "border-b border-zinc-200 pb-4" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-semibold text-white">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-neutral-800">{name}</p>
          {meta ? (
            <p className="truncate text-sm text-zinc-500">{meta}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
};
