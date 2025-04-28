"use client";
import React from "react";

export type OptionItem = {
    value: string;
    label: string;
  };

interface SelectTagProps {
  options: OptionItem[];
  defaultValue?: string;
  optionLabel?: string;
  onOptionItemClick: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}


export const CustomSelectTag: React.FC<SelectTagProps> = ({options, defaultValue, optionLabel, onOptionItemClick}) => {
  return (
    <section className="flex gap-2 items-center text-sm text-zinc-700">
      <select
        className="appearance-none flex overflow-hidden gap-3 self-stretch px-2 py-1 my-auto bg-white rounded min-w-[159px] text-zinc-700 cursor-pointer"
        defaultValue={defaultValue || optionLabel || options[0]?.value}
        onChange={onOptionItemClick}
        aria-label="Filter by category"
      >
        {/* If selected value is optionLabel, no filtering will be applied */}
        {optionLabel && <option value={optionLabel}>{optionLabel}</option>} 
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div
        className="relative pointer-events-none"
        style={{ marginLeft: "-28px" }}
      >
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/c6feee3a2cc31f2ab869c95399cb5d21ebae648f?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab"
          className="object-contain w-4 aspect-square pr-1"
          alt=""
          aria-hidden="true"
        />
      </div>
    </section>
  );
};