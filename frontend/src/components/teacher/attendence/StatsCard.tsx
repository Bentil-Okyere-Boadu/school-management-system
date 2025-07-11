"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  fromColor: string;
  toColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, fromColor, toColor }) => {
  return (
    <div
      className={`rounded-xl text-white px-6 py-5 min-w-[220px] max-md:w-full font-sans shadow-md`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${fromColor}, ${toColor})`,
      }}
    >
      <p className="text-sm mb-2">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
};

export default StatCard;
