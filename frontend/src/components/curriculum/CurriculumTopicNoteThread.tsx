"use client";

import React from "react";
import { IconTrash } from "@tabler/icons-react";
import type { CurriculumTopicNote } from "@/@types";

/** Total messages including nested replies (for section titles). */
export function countTopicNotesInTree(nodes: CurriculumTopicNote[]): number {
  return nodes.reduce((sum, n) => {
    return (
      sum + 1 + (n.replies?.length ? countTopicNotesInTree(n.replies) : 0)
    );
  }, 0);
}

export type CurriculumTopicNoteThreadProps = {
  note: CurriculumTopicNote;
  /** Only for root notes (thread heads). Nested replies never show delete. */
  onDeleteRootNote?: (id: string) => void;
  depth?: number;
  formatDate?: (iso: string) => string;
};

function defaultFormatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function CurriculumTopicNoteThread({
  note,
  onDeleteRootNote,
  depth = 0,
  formatDate = defaultFormatDate,
}: CurriculumTopicNoteThreadProps) {
  const isAdmin = note.authorRole === "school_admin";
  const badgeClass = isAdmin
    ? "bg-purple-100 text-purple-800"
    : "bg-emerald-100 text-emerald-800";
  const label = isAdmin ? "Admin" : "Teacher";
  const isRoot = depth === 0;

  return (
    <li>
      <div
        className={`rounded-lg border border-gray-100 px-3 py-2.5 ${
          isAdmin ? "bg-purple-50/50" : "bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <span
            className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${badgeClass}`}
          >
            {isAdmin ? "admin" : "teacher"}
          </span>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-gray-400">
              {note.createdAt ? formatDate(note.createdAt) : ""}
            </span>
            {onDeleteRootNote && isRoot ? (
              <button
                type="button"
                onClick={() => onDeleteRootNote(note.id)}
                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                aria-label="Delete note"
              >
                <IconTrash size={16} stroke={1.5} />
              </button>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {note.content}
        </p>
      </div>
      {note.replies?.length ? (
        <ul className="mt-2 ml-4 pl-3 border-l border-gray-200 space-y-2">
          {note.replies.map((r) => (
            <CurriculumTopicNoteThread
              key={r.id}
              note={r}
              depth={depth + 1}
              formatDate={formatDate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
