"use client";

import React, { useEffect, useState } from "react";
import { School } from "@/@types";
import { useUpdateParentResultVisibility } from "@/hooks/school-admin";
import CustomButton from "@/components/Button";
import { toast } from "react-toastify";

type Props = {
  schoolData?: School | null;
};

export const ParentVisibilitySection: React.FC<Props> = ({ schoolData }) => {
  const { mutate, isPending } = useUpdateParentResultVisibility();
  const [settings, setSettings] = useState({
    parentShowScores: true,
    parentShowGrades: true,
    parentShowLabels: true,
    parentShowFeedback: true,
  });

  useEffect(() => {
    if (!schoolData) return;
    setSettings({
      parentShowScores: schoolData.parentShowScores ?? true,
      parentShowGrades: schoolData.parentShowGrades ?? true,
      parentShowLabels: schoolData.parentShowLabels ?? true,
      parentShowFeedback: schoolData.parentShowFeedback ?? true,
    });
  }, [schoolData]);

  const handleSave = () => {
    mutate(settings, {
      onSuccess: () => toast.success("Parent visibility settings saved"),
      onError: () => toast.error("Failed to save parent visibility settings"),
    });
  };

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="text-base font-semibold text-neutral-900">
        Parent result visibility
      </h3>
      <p className="mt-1 text-sm text-neutral-600">
        Choose what published result details parents can see for linked children.
      </p>
      <div className="mt-4 space-y-3">
        {(
          [
            ["parentShowScores", "Show scores"],
            ["parentShowGrades", "Show grades"],
            ["parentShowLabels", "Show grade labels"],
            ["parentShowFeedback", "Show teacher feedback"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, [key]: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-purple-600"
            />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-4">
        <CustomButton
          text="Save visibility settings"
          onClick={handleSave}
          disabled={isPending}
        />
      </div>
    </section>
  );
};
