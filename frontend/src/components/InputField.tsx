"use client";
import React, { forwardRef } from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  isPasswordField?: boolean;
  isTransulent?: boolean;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, type = "text", isPasswordField = false, isTransulent = false, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label className="mb-1.5 text-xs text-zinc-600 block">{label}</label>
        <input
          ref={ref}
          type={type}
          disabled={isTransulent}
          {...props}
          className={`px-3 py-2.5 h-10 rounded border-solid border-[0.5px] border-zinc-500 text-zinc-800 w-full 
            ${isPasswordField ? "text-2xl font-bold" : "text-base"}
            ${isTransulent ? "bg-[#8787871A] bg-opacity-10 !border-none outline-none" : ""}`}
        />
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
