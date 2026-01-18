"use client";

import { IconX } from "@tabler/icons-react";
import * as React from "react";

interface EmailItemProps {
  email: string;
  onIconClick?: (email: string) => void;
}

export const EmailItem: React.FC<EmailItemProps> = ({ email, onIconClick }) => {
  return (
    <article className="flex gap-5 px-3.5 py-1.5 w-fit rounded bg-violet-50 bg-opacity-60">
      <p className="grow text-gray-800 text-sm">{email}</p>
    <button
        onClick={() => onIconClick?.(email)}
        className="cursor-pointer"
        aria-label="Remove document"
    >
        <IconX size={15} className="text-red-600" />
    </button>
    </article>
  );
};
