"use client";
import React from "react";

interface SidebarProps {
  activeItem: string;
  onItemChange: (item: string) => void;
  sidebarItems: SidebarItem[];
}

interface SidebarItem {
  icon: string;
  label: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onItemChange,
  sidebarItems,
}) => {

  return (
    <aside className="box-border p-5 w-60 bg-[#D9CDE2] max-md:flex max-md:justify-around max-md:w-full flex flex-col">
      <nav className="pt-[144px]">
        <p className="mb-2 ml-4 text-xs text-neutral-500">MAIN MENU</p>
        {sidebarItems.map((item, index) => (
          <button
            key={index}
            onClick={() => onItemChange(item.label)}
            className={`flex items-center px-4 py-2.5 mb-2.5 cursor-pointer text-base rounded-md w-full text-left transition-colors duration-200 ${
              item.label === activeItem
                ? "bg-gradient-to-r from-[#AB58E7] to-[#C9A1E6] text-white"
                : "text-zinc-600 hover:bg-zinc-200 hover:bg-opacity-50"
            }`}
          >
            <div
              className="mr-2.5"
              dangerouslySetInnerHTML={{
                __html:
                  item.label === activeItem
                    ? item.icon.replace('fill="#5B5B5B"', 'fill="white"')
                    : item.icon.replace('fill="white"', 'fill="#5B5B5B"'),
              }}
            ></div>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
