"use client";

import React from "react";
import { HashLoader } from "react-spinners";
import { IconBook, IconList } from "@tabler/icons-react";

interface SubjectCatalogData {
  id?: string;
  name: string;
  description?: string;
  topics?: Array<{ id: string }>;
}

interface SubjectCardProps {
  subjectData: SubjectCatalogData;
  topicsCount?: number;
  busy?: boolean;
  showViewTopics?: boolean;
  onViewTopicsClick?: (item: SubjectCatalogData) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subjectData,
  topicsCount,
  busy = false,
  showViewTopics = false,
  onViewTopicsClick,
}) => {
  const computedTopicsCount =
    typeof topicsCount === "number"
      ? topicsCount
      : subjectData?.topics?.length ?? 0;

  return (
    <div className="relative bg-white rounded-xl shadow-sm p-4 w-full border border-gray-100 flex flex-col">
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-xl">
          <HashLoader color="#AB58E7" size={30} />
        </div>
      )}

      <div className="flex justify-between items-start">
        <h2 className="text-lg font-semibold text-gray-900">{subjectData?.name}</h2>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <div className="flex gap-1.5 items-center">
            <IconBook size={18} className="text-gray-500" />
            <span className="text-gray-500">Topics:</span>
          </div>
          <span className="font-medium">{computedTopicsCount}</span>
        </div>

        <div className="flex gap-1">
          <div className="flex gap-1.5 flex-start">
            <IconList size={18} className="text-gray-500" />
            <span className="text-gray-500">Description:</span>
          </div>
          <span className="font-normal mb-4">{subjectData?.description || "-"}</span>
        </div>
      </div>

      {showViewTopics && (
        <div className="mt-auto pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <span
              onClick={() => onViewTopicsClick?.(subjectData)}
              className="inline-block text-xs font-medium text-purple-800 bg-purple-100 px-3 py-1 rounded-full cursor-pointer hover:shadow-md transition-shadow"
            >
              View Topics
            </span>
          </div>
        </div>
      )}
    </div>
  );
};


