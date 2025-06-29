"use client";

import Image from "next/image";
import React from "react";

interface StatCardProps {
  value: number | string;
  label: string;
  iconUrl: string;
  iconAlt: string;
  valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  iconUrl,
  iconAlt,
  valueColor,
}) => {
  return (
<article className="flex items-center justify-between px-5 py-4 rounded-lg border border-solid bg-[#fff] bg-opacity-70 border-zinc-50 h-[104px] min-w-[220px] w-full max-md:items-center max-md:gap-2 max-md:py-5 max-md:h-auto max-sm:px-4">
  <div className="flex flex-col justify-center">
    <h2 className="text-3xl font-bold bg-clip-text max-sm:text-2xl" style={{ color: valueColor }}>{value}</h2>
    <p className="text-xs text-neutral-700 max-sm:text-xs font-medium">{label}</p>
  </div>

  <Image
    src={iconUrl}
    className="w-[66px] h-[66px] max-md:w-14 max-md:h-14 pb-[-4px]"
    alt={iconAlt}
    height={100}
    width={100}
  />
</article>
  );
};

export default StatCard;
