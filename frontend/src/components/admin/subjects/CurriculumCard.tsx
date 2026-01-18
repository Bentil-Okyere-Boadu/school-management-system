"use client";

import React from "react";
import { IconTrash, IconEdit, IconBook, IconList, IconInfoCircle } from "@tabler/icons-react";
import { Tooltip } from "@mantine/core";
import { HashLoader } from "react-spinners";

interface Curriculum {
  id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  subjectCatalogIds?: string[];
}

interface CurriculumCardProps {
  curriculumData: Curriculum;
  onEditClick?: (item: Curriculum) => void;
  onDeleteClick?: (id?: string) => void;
  showEditAndDelete?: boolean;
  showViewSubjects?: boolean;
  onViewSubjectsClick?: (item: Curriculum) => void;
  showToggleActive?: boolean;
  onToggleActiveClick?: (item: Curriculum) => void;
  subjectCount?: number; // optional override; defaults to subjectCatalogIds?.length
  tooltipText?: string;
  busy?: boolean;
}

export const CurriculumCard: React.FC<CurriculumCardProps> = ({
  curriculumData,
  onEditClick,
  onDeleteClick,
  showEditAndDelete = false,
  showViewSubjects = false,
  onViewSubjectsClick,
  showToggleActive = false,
  onToggleActiveClick,
  subjectCount,
  tooltipText = "",
  busy = false,
}) => {
  const computedSubjectCount = subjectCount ?? (curriculumData?.subjectCatalogIds?.length ?? 0);

  return (
    <div className="relative bg-white rounded-xl shadow-sm p-4 w-full border border-gray-100 flex flex-col">
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-xl">
          <HashLoader color="#AB58E7" size={30} />
        </div>
      )}

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold text-gray-900">{curriculumData?.name}</h2>
          {showEditAndDelete && (
            <div className="flex gap-2">
              <IconEdit
                size={18}
                onClick={() => onEditClick?.(curriculumData)}
                className="text-blue-600 cursor-pointer"
              />
              <IconTrash
                size={18}
                onClick={() => onDeleteClick?.(curriculumData?.id)}
                className="text-red-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <div className="flex gap-1.5 items-center">
              <IconInfoCircle size={18} className="text-gray-500" />
              <span className="text-gray-500">Status:</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
                ${curriculumData?.isActive ? "text-green-800 bg-green-100" : "text-gray-700 bg-gray-100"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  curriculumData?.isActive ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              {curriculumData?.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="flex justify-between">
            <div className="flex gap-1.5 items-center">
              <IconBook size={18} className="text-gray-500" />
              <span className="text-gray-500">Subjects count:</span>
            </div>
            <span className="font-medium">{computedSubjectCount}</span>
          </div>

          <div className="flex gap-1">
            <div className="flex gap-1.5 flex-start">
              <IconList size={18} className="text-gray-500" />
              <span className="text-gray-500">Description:</span>
            </div>
            <span className="font-normal">{curriculumData?.description}</span>
          </div>
        </div>
      </div>

      {(showViewSubjects || showToggleActive) && (
        <div className="mt-auto pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center gap-1 flex-wrap">
            {showViewSubjects && (
              <span
                onClick={() => onViewSubjectsClick?.(curriculumData)}
                className="inline-block text-xs font-medium text-purple-800 bg-purple-100 px-3 py-1 rounded-full cursor-pointer hover:shadow-md transition-shadow"
              >
                View Subjects
              </span>
            )}
            {showToggleActive && (
              <Tooltip
                multiline
                w={240}
                withArrow
                disabled={!tooltipText}
                transitionProps={{ duration: 200 }}
                label={tooltipText}
              >
                <span
                  onClick={() => onToggleActiveClick?.(curriculumData)}
                  className={`inline-block text-xs font-medium px-3 py-1 rounded-full cursor-pointer hover:shadow-md transition-shadow
                    ${
                      curriculumData?.isActive
                        ? "text-red-800 bg-red-100 hover:bg-red-200"
                        : "text-green-800 bg-green-100 hover:bg-green-200"
                    }`}
                >
                  {curriculumData?.isActive ? "Deactivate" : "Activate"}
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </div>
  );
};