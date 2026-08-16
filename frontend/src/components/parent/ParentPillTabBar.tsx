"use client";

import React from "react";

export type ParentTabItem = {
  tabLabel: string;
  tabKey: string;
};

interface ParentPillTabBarProps {
  items: ParentTabItem[];
  activeTabKey?: string;
  onItemClick: (item: ParentTabItem) => void;
  className?: string;
  trackClassName?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  inactiveItemClassName?: string;
}

function joinClasses(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const ParentPillTabBar: React.FC<ParentPillTabBarProps> = ({
  items,
  activeTabKey,
  onItemClick,
  className,
  trackClassName,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
}) => {
  return (
    <nav className={joinClasses("mb-4", className)}>
      <ul
        className={joinClasses(
          "flex w-full items-center bg-slate-200",
          trackClassName ?? "rounded-2xl p-1",
        )}
      >
        {items.map((item) => {
          const isActive = activeTabKey === item.tabKey;
          return (
            <li key={item.tabKey}>
              <button
                type="button"
                onClick={() => onItemClick(item)}
                className={joinClasses(
                  "cursor-pointer font-medium focus:outline-none",
                  itemClassName ?? "rounded-lg px-4 py-1 !!text-xs",
                  isActive
                    ? joinClasses("bg-white text-slate-800 shadow-sm", activeItemClassName)
                    : joinClasses("text-slate-500", inactiveItemClassName),
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.tabLabel}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
