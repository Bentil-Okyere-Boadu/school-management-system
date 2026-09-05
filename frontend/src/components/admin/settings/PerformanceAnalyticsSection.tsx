"use client";

import React, { useEffect, useState } from "react";
import { School } from "@/@types";
import { useUpdatePerformanceAnalyticsEnabled } from "@/hooks/school-admin";
import CustomButton from "@/components/Button";
import { toast } from "react-toastify";

type Props = {
  schoolData?: School | null;
};

export const PerformanceAnalyticsSection: React.FC<Props> = ({ schoolData }) => {
  const { mutate, isPending } = useUpdatePerformanceAnalyticsEnabled();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!schoolData) return;
    setEnabled(schoolData.performanceAnalyticsEnabled ?? true);
  }, [schoolData]);

  const handleSave = () => {
    mutate(
      { performanceAnalyticsEnabled: enabled },
      {
        onSuccess: () => toast.success("Performance analytics setting saved"),
        onError: () =>
          toast.error("Failed to save performance analytics setting"),
      },
    );
  };

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="text-base font-semibold text-neutral-900">
        Performance Analytics
      </h3>
      <p className="mt-1 text-sm text-neutral-600">
        When enabled, school admins, teachers, students, and parents can access
        performance analytics. Disabling removes analytics from all personas,
        including the parent portal.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-purple-600"
        />
        Enable Performance Analytics
      </label>
      <div className="mt-4">
        <CustomButton
          text="Save analytics setting"
          onClick={handleSave}
          disabled={isPending}
        />
      </div>
    </section>
  );
};
