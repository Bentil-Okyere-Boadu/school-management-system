"use client";

import React from "react";
import NavigationItem from "./NavigationItem";

export type NavItem = {
  tabLabel: string;
  tabKey: string;
};

interface NavigationBarProps {
  items: NavItem[];
  activeTabKey?: string;
  onItemClick: (item: NavItem) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  items,
  activeTabKey,
  onItemClick,
}) => {

  return (
    <nav className="flex gap-9 items-center max-md:gap-8 max-sm:justify-center mb-4">
      <div className="relative">
        <ul className="flex space-x-8">
          {items.map((item, index) => (
            <NavigationItem
              key={item.tabKey}
              item={item}
              isActive={activeTabKey === item.tabKey}
              onClick={() => onItemClick(item)} // the child's event will cause this to trigger it's parent function onItemClick
            />
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavigationBar;
