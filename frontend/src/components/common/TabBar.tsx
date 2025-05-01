"use client";

import React from "react";
import TabItem from "./TabItem";

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

interface TabBarProps {
  items: TabListItem[];
  activeTabKey?: string;
  onItemClick: (item: TabListItem) => void;
}

const TabBar: React.FC<TabBarProps> = ({
  items,
  activeTabKey,
  onItemClick,
}) => {

  return (
    <nav className="flex gap-9 items-center max-md:gap-8 mb-4">
      <div className="relative">
        <ul className="flex space-x-8">
          {items.map((item) => (
            <TabItem
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

export default TabBar;
