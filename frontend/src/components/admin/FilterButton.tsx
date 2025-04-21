"use client";
import React from "react";


const FilterButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (
  props,
) => {
  return (
    <button
      className="inline-flex gap-1.5 items-center pt-2 pr-4 pb-2.5 pl-4 h-9 rounded border-solid bg-neutral-200 border-[0.5px] border-zinc-700 w-[90px] cursor-pointer"
      type="button"
      aria-label="Filter"
      {...props}
    >
      <FilterIcon />
      <span className="text-sm text-zinc-700">Filter</span>
    </button>
  );
};


const FilterIcon: React.FC = () => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="filter-icon"
      style={{ width: "14px", height: "14px"}}
      aria-hidden="true"
    >
      <path
        d="M2.66667 2H13.3333C13.5101 2 13.6797 2.07024 13.8047 2.19526C13.9298 2.32029 14 2.48986 14 2.66667V3.724C14 3.9008 13.9297 4.07034 13.8047 4.19533L9.52867 8.47133C9.40363 8.59633 9.33337 8.76587 9.33333 8.94267V13.146C9.33333 13.2473 9.31023 13.3473 9.26578 13.4384C9.22133 13.5295 9.1567 13.6092 9.07681 13.6716C8.99692 13.7339 8.90387 13.7772 8.80473 13.7982C8.70559 13.8192 8.60297 13.8173 8.50467 13.7927L7.17133 13.4593C7.02717 13.4232 6.89921 13.34 6.80777 13.2228C6.71634 13.1056 6.66667 12.9613 6.66667 12.8127V8.94267C6.66663 8.76587 6.59637 8.59633 6.47133 8.47133L2.19533 4.19533C2.0703 4.07034 2.00004 3.9008 2 3.724V2.66667C2 2.48986 2.07024 2.32029 2.19526 2.19526C2.32029 2.07024 2.48986 2 2.66667 2Z"
        stroke="#464646"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default FilterButton;
