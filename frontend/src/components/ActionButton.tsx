"use client";
import React from "react";

interface ActionButtonProps {
  text: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full h-10 text-base font-semibold text-white bg-purple-500 rounded-md border-white border-solid cursor-pointer border-[0.3px]"
    >
      {text}
    </button>
  );
};

export default ActionButton;
