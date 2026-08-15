"use client";
import { IconChevronDown } from "@tabler/icons-react";
import React from "react";

export type OptionItem = {
    value: string;
    label: string;
  };

export type SelectTagVariant = "default" | "outline";

interface SelectTagProps {
  options: OptionItem[];
  value?: string;
  optionLabel?: string;
  selectClassName?: string;
  variant?: SelectTagVariant;
  onOptionItemClick: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const variantSelectClass: Record<SelectTagVariant, string> = {
  default: "bg-white rounded min-w-[159px] px-2 py-1",
  outline:
    "bg-zinc-50 rounded-xl border border-zinc-200 min-w-[159px] px-3.5 py-1.5 pr-8",
};

export const CustomSelectTag: React.FC<SelectTagProps> = ({
  options,
  value,
  optionLabel,
  selectClassName,
  variant = "default",
  onOptionItemClick,
}) => {
  const isOutline = variant === "outline";

  return (
    <section className="relative flex items-center text-sm text-zinc-700">
      <select
        className={`appearance-none flex overflow-hidden gap-3 self-stretch my-auto text-zinc-700 cursor-pointer ${variantSelectClass[variant]} ${selectClassName ?? ""}`}
        value={value}
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
        className={`pointer-events-none ${
          isOutline
            ? "absolute right-3 top-1/2 -translate-y-1/2"
            : "relative"
        }`}
        style={isOutline ? undefined : { marginLeft: "-30px" }}
      >
        <IconChevronDown
          className={
            isOutline
              ? "h-4 w-4 text-zinc-600"
              : "object-contain w-5 aspect-square pr-1 bg-white"
          }
        />
      </div>
    </section>
  );
};