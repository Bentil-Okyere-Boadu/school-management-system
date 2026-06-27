"use client";

import React from "react";
import {
  IconEdit,
  IconTrash,
  IconUserStar,
  IconSchool,
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";
import { ClassLevel } from "@/@types";
import { Badge, Tooltip } from "@mantine/core";
import { HashLoader } from "react-spinners";

interface AdminClassResultsCardProps {
  classData: ClassLevel;
  studentCount: number;
  isAdminLocked: boolean;
  teacherSubmitted: boolean;
  onLockToggle: (item: ClassLevel) => void;
  onEditClick?: (item: ClassLevel) => void;
  onDeleteClick?: (id: string) => void;
  onCardClick?: (item: ClassLevel) => void;
  lockTooltip?: string;
  busy?: boolean;
}

export const AdminClassResultsCard: React.FC<AdminClassResultsCardProps> = ({
  classData,
  studentCount,
  isAdminLocked,
  teacherSubmitted,
  onLockToggle,
  onEditClick,
  onDeleteClick,
  onCardClick,
  lockTooltip = "",
  busy = false,
}) => {
  return (
    <div
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onClick={() => onCardClick?.(classData)}
      onKeyDown={(e) => {
        if (onCardClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onCardClick(classData);
        }
      }}
      className={`relative bg-white rounded-xl shadow-sm p-4 w-full border border-gray-100 flex flex-col min-h-[220px] ${
        onCardClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
    >
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-xl">
          <HashLoader color="#AB58E7" size={30} />
        </div>
      )}

      <div className="flex justify-between items-start gap-2">
        <h2 className="text-lg font-semibold text-gray-900 pr-2">{classData?.name}</h2>
        <div className="flex items-center gap-2 shrink-0">
          {isAdminLocked ? (
            <Badge
              size="sm"
              variant="filled"
              color="#fef2f2"
              className="font-semibold uppercase tracking-wide text-xs"
              style={{ color: "#991B1B" }}
            >
              Locked
            </Badge>
          ) : (
            <Badge
              size="sm"
              variant="outline"
              color="green"
              className="font-semibold border-emerald-300 text-emerald-800 bg-emerald-50/80"
            >
              Unlocked
            </Badge>
          )}
          {(onEditClick || onDeleteClick) && (
            <div className="flex gap-1">
              {onEditClick && (
                <IconEdit
                  size={18}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(classData);
                  }}
                  className="text-blue-600 cursor-pointer"
                  aria-label="Edit class"
                />
              )}
              {onDeleteClick && (
                <IconTrash
                  size={18}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(classData?.id);
                  }}
                  className="text-red-500 cursor-pointer"
                  aria-label="Delete class"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-gray-700 flex-1">
        <div className="flex justify-between gap-2">
          <div className="flex gap-1.5 items-center min-w-0">
            <IconUserStar size={18} className="text-gray-500 shrink-0" />
            <span className="text-gray-500">Class teacher</span>
          </div>
          <span className="font-medium text-right truncate">
            {classData?.classTeacher?.firstName} {classData?.classTeacher?.lastName}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <div className="flex gap-1.5 items-center">
            <IconSchool size={18} className="text-gray-500 shrink-0" />
            <span className="text-gray-500">Students</span>
          </div>
          <span className="font-medium">{studentCount}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-gray-500">Results submitted</span>
          <span className="font-medium tabular-nums text-gray-900">
            {teacherSubmitted ? "1 / 1" : "0 / 1"}
          </span>
        </div>
        <p className="text-xs text-gray-400 -mt-1">
          Class teacher has submitted for this term · {studentCount}{" "}
          {studentCount === 1 ? "student" : "students"} in class
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <Tooltip
          multiline
          w={260}
          withArrow
          disabled={!lockTooltip}
          label={lockTooltip}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLockToggle(classData);
            }}
            className={`w-full flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              isAdminLocked
                ? "border-green-200 text-green-800 bg-green-50 hover:bg-green-100"
                : "border-red-200 text-red-800 bg-red-50 hover:bg-red-100"
            }`}
          >
            {isAdminLocked ? (
              <>
                <IconLockOpen size={18} />
                Unlock results
              </>
            ) : (
              <>
                <IconLock size={18} />
                Lock results
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
