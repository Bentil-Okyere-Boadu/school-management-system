"use client";
import { IconChevronDown } from "@tabler/icons-react";
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
        <IconChevronDown className="object-contain w-5 aspect-square pr-1" />
      </div>
    </section>
  );
};