"use client";
import React, { forwardRef, ReactNode } from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  isPasswordField?: boolean;
  isTransulent?: boolean;
  rightButton?: ReactNode;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({
      label,
      type = "text",
      isPasswordField = false,
      isTransulent = false,
      rightButton,
      required,
      ...props
    },
    ref
  ) => {
    return (
      <div>
        <label className="mb-1.5 text-xs text-zinc-600 block">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            type={type}
            disabled={isTransulent}
            {...props}
            className={`px-3 py-2.5 h-10 rounded border-gray-300 border-[0.1px] text-zinc-800 w-full 
              ${isPasswordField ? "text-2xl font-bold" : "text-base"}
              ${isTransulent ? "bg-[#8787871A] bg-opacity-10 !border-none outline-none" : ""}
              ${rightButton ? "pr-26" : ""}
            `}
          />
          {rightButton && (
            <div className="absolute inset-y-0 right-2 flex items-center">
              {rightButton}
            </div>
          )}
        </div>
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
