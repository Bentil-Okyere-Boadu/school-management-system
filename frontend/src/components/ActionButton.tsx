"use client";
import { ButtonType } from "@/@types";
import React from "react";
import Loader from "./Loader";

interface ActionButtonProps {
  text: string;
  type?: ButtonType;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ text, type, onClick, disabled, loading = false}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full h-10 text-base font-semibold text-white bg-purple-500 rounded-md border-white border-solid cursor-pointer border-[0.3px] flex items-center justify-center ${
        loading ? "opacity-65" : ""
      }`}
      type={type}
      disabled={disabled}
    >
      {loading? <Loader/> : ""}
      {text}
    </button>
  );
};

export default ActionButton;
