"use client";
import React from "react";

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  isPasswordField?: boolean;
  isTransulent?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  isPasswordField = false,
  isTransulent = false,
}) => {
  return (
    <div className="mb-4">
      <label className="mb-1.5 text-xs text-zinc-600 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`px-3 py-2.5 h-10 rounded border-solid border-[0.5px] border-zinc-500 text-zinc-800 w-full 
          ${ isPasswordField ? "text-2xl font-bold" : "text-base"}
          ${isTransulent ? "bg-[#8787871A] bg-opacity-10 !border-none outline-none" : ""}`}
      />
    </div>
  );
};

export default InputField;
