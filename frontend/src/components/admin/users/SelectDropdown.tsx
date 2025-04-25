import React from "react";
import { DropdownIcon } from "./icons";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  id: string;
  label: string;
  options: SelectOption[];
  selectedItem: string;
  onChange: (value: string) => void;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  id,
  label,
  options,
  selectedItem,
  onChange,
}) => {
  return (
    <div className="mb-6">
      <label htmlFor={id} className="block mb-2 text-xs text-zinc-600">
        {label}
      </label>
      <div className="relative max-md:w-full">
        <select
          id={id}
          value={selectedItem}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none box-border w-full px-3 py-0 h-10 rounded border-solid border-[0.5px] border-zinc-500 text-base text-zinc-800 bg-transparent"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <DropdownIcon />
        </div>
      </div>
    </div>
  );
};

export default SelectDropdown;
