"use client";

import React from "react";
import { IconTrash, IconEdit, IconSchool, IconUserStar, IconScript } from "@tabler/icons-react";
import { ClassLevel } from "@/@types";

interface ClassCardProps {
  classData: ClassLevel;
  onEditClick?: (item: ClassLevel) => void;
  onDeleteClick?: (id: string) => void;
  showEditAndDelete?: boolean
  showGoToAttendance?: boolean,
  showGoToGrading?: boolean,
  onNavigateToAttendanceClick?: (item: ClassLevel) => void;
  onNavigateToGradingClick?: (item: ClassLevel) => void;
  studentCount?: number;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  classData,
  onEditClick,
  onDeleteClick,
  showEditAndDelete = false,
  showGoToAttendance = false,
  showGoToGrading = false,
  onNavigateToAttendanceClick,
  onNavigateToGradingClick,
  studentCount,
}) => {
  return (
    <div
      className="bg-white rounded-xl shadow-sm p-4 w-full border border-gray-100"
    >
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-semibold text-gray-900">{classData?.name}</h2>
        {showEditAndDelete && 
          <div className="flex gap-2">
            <IconEdit size={18} onClick={() => onEditClick?.(classData)} className="text-blue-600 cursor-pointer" />
            <IconTrash size={18} onClick={() => onDeleteClick?.(classData?.id)} className="text-red-500 cursor-pointer" />
          </div>
        }
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-gray-700">
        <div className="flex justify-between">
            <div className="flex gap-1.5 items-center">
                <IconUserStar size={18} className="text-gray-500" />
                <span className="text-gray-500">Class Teacher:</span>
            </div>
          <span className="font-medium">{classData?.teachers?.[0]?.firstName} {classData?.teachers?.[0]?.lastName}</span>
        </div>
        <div className="flex justify-between">
            <div className="flex gap-1.5 items-center">
                <IconSchool size={18} className="text-gray-500" />
                <span className="text-gray-500">Students count:</span>
            </div>
          <span className="font-medium">{studentCount}</span>
        </div>
        <div className="flex gap-1">
            <div className="flex gap-1.5 items-center">
                <IconScript size={18} className="text-gray-500" />
                <span className="text-gray-500">Description:</span>
            </div>
          <span className="font-normal">{classData?.description}</span>
        </div>
      </div>

      {
        (showGoToAttendance || showGoToGrading) && (
          <div className="mt-4 pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center gap-1 flex-wrap">
              {showGoToAttendance &&
              <span onClick={() => onNavigateToAttendanceClick?.(classData)} className="inline-block text-xs font-medium text-purple-800 bg-purple-100 px-3 py-1 rounded-full cursor-pointer hover:shadow-md transition-shadow">
                Go to Attendance View
              </span>
              }
              {showGoToGrading &&
              <span onClick={() => onNavigateToGradingClick?.(classData)} className="inline-block text-xs font-medium text-blue-800 bg-blue-100 px-3 py-1 rounded-full cursor-pointer hover:shadow-md transition-shadow">
                Go to Grading View
              </span> 
              }
            </div>
          </div>
        )
      }
    </div>
  );
};
