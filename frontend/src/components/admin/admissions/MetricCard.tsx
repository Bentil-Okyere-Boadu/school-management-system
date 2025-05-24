"use client";

import React from "react";

export interface MetricCardProps {
  value: string;
  label: string;
  icon: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ value, label, icon }) => {
  return (
    <article className="flex relative flex-col gap-3 justify-center items-start px-6 py-5 bg-white rounded-xl shadow-sm min-w-[220px] max-md:w-full  max-sm:p-4">
      <div className="flex justify-between items-start w-full h-[66px]">
        <div className="flex flex-col items-start">
          <h2 className="text-3xl font-bold leading-10 text-neutral-800 max-sm:text-2xl">
            {value}
          </h2>
          <p className="text-base leading-6 text-zinc-600 max-sm:text-sm">
            {label}
          </p>
        </div>
        <div className="flex gap-2.5 items-start p-2.5 bg-white rounded-xl shadow-sm">
          <div dangerouslySetInnerHTML={{ __html: icon }} />
        </div>
      </div>
      {/* <TrendIndicator direction={trend.direction} percentage={trend.percentage} /> */}
    </article>
  );
};
