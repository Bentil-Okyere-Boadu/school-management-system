import React from "react";

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

interface TabItemProps {
  item: TabListItem;
  isActive: boolean;
  onClick: () => void;
}

const TabItem: React.FC<TabItemProps> = ({
  item,
  isActive,
  onClick,
}) => {
  return (
    <li className="relative">
      <button
        onClick={onClick} // Clicking the button will trigger a parent function onClick (which was passed as a prop)
        className={`text-sm font-medium focus:outline-none cursor-pointer ${
          isActive ? "text-purple-500 font-semibold" : "text-gray-400"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        {item.tabLabel}
      </button>
      {isActive && (
        <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2">
          <div className="w-[5px] h-[5px] rounded-full bg-purple-500"></div>
        </div>
      )}
    </li>
  );
};

export default TabItem;
