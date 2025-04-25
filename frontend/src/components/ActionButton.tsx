"use client";
import React from "react";
import Loader from "./Loader";

interface ActionButtonProps {
  text: string;
  onClick?: () => void;
  loading?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ text, onClick, loading = false}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full h-10 text-base font-semibold text-white bg-purple-500 rounded-md border-white border-solid cursor-pointer border-[0.3px] flex items-center justify-center ${
        loading ? "opacity-65" : ""
      }`}
    >
      {loading? <Loader/> : ""}
      {text}
    </button>
  );
};

export default ActionButton;
