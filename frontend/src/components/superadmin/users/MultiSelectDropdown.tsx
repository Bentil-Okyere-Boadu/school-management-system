"use client";
import React, { useState, useEffect, useRef } from "react";
import { CheckIcon } from "./icons";

export interface DropdownItem {
  id: string;
  label: string;
}

interface MultiSelectDropdownProps {
  items: DropdownItem[];
  selectedItems?: string[]; // Pre-selected item IDs
  onChange?: (selected: string[]) => void;
  label?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  items,
  selectedItems = [],
  onChange,
  label = "Select Items",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(selectedItems);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(selectedItems);
  }, [selectedItems]);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle the selection of an item
  const toggleItem = (id: string) => {
    const updatedSelected = selected.includes(id)
      ? selected.filter((itemId) => itemId !== id)
      : [...selected, id];

    setSelected(updatedSelected);
    onChange?.(updatedSelected);
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => setIsOpen(!isOpen);

  const selectedItemsData = items.filter((item) => selected.includes(item.id));

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block mb-2 text-xs text-zinc-600">{label}</label>

      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="flex justify-between items-center w-full px-3 py-2 text-left rounded border border-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[40px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
          {selectedItemsData.length === 0 ? (
            <span className="text-base text-zinc-500">No items selected</span>
          ) : (
            selectedItemsData.map((item) => (
              <span
                key={item.id}
                className="px-2 py-0.5 text-sm leading-5 text-violet-700 bg-purple-50 rounded-2xl"
              >
                {item.label}
              </span>
            ))
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform flex-shrink-0 ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 6L8 11L13 6H3Z" fill="#464646" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownContentRef}
          className="absolute z-50 w-full bg-white rounded shadow-lg mt-1 max-h-[250px] overflow-y-auto"
          role="listbox"
          aria-multiselectable="true"
          style={{
            top: '100%', // Position the dropdown below the button
            left: 0, // Align with the left of the parent
            right: 0, // Ensure it stretches the full width of the button
            marginTop: '2px', // Optional: small margin for visual separation
            zIndex: 1000, // Ensure the dropdown overlays other content
          }}
        >
          <div className="flex flex-col gap-3 py-3 pr-6 pl-4 rounded border border-zinc-500 max-h-[250px] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-2 items-center cursor-pointer"
                role="option"
                aria-selected={selected.includes(item.id)}
                onClick={() => toggleItem(item.id)}
              >
                <div className="flex justify-center items-center px-0.5 py-1 w-5 h-5 bg-white rounded-md border border-gray-300">
                  {selected.includes(item.id) && <CheckIcon />}
                </div>
                <span className="text-base text-zinc-800">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
