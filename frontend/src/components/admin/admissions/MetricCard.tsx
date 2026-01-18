"use client";

import React from "react";

export interface MetricCardProps {
  value: number;
  label: string;
  icon: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ value, label, icon }) => {
  return (
    <article className="flex flex-col gap-2 px-6 py-5 bg-white rounded-xl shadow-sm min-w-[220px] max-md:w-full max-sm:p-4">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-3xl font-bold leading-10 text-neutral-800 max-sm:text-2xl">
          {value}
        </h2>
        <div className="flex items-center p-2.5 bg-white rounded-xl shadow-sm">
          <div dangerouslySetInnerHTML={{ __html: icon }} />
        </div>
      </div>
      <p className="text-base leading-6 text-zinc-600 max-sm:text-sm">
        {label}
      </p>
    </article>
  );
};
