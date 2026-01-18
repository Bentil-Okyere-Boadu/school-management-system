"use client";
import React, { forwardRef, ReactNode, useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

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
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = isPasswordField || type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    
    // Ensure value is always a string to prevent uncontrolled/controlled warning
    const normalizedValue = value ?? "";

    return (
      <div className="mb-4">
        <label className="mb-1.5 text-xs text-zinc-600 block">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            disabled={isTransulent}
            value={normalizedValue}
            {...props}
            className={`px-3 py-2.5 h-10 rounded border-solid border-[0.5px] border-zinc-500 text-zinc-800 w-full
              ${isPassword ? "text-2xl font-bold" : "text-base"}
              ${isTransulent ? "bg-[#8787871A] bg-opacity-10 !border-none outline-none" : ""}
              ${rightButton ? "pr-26" : ""}
              ${isPassword ? "pr-8" : ""}
            `}
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            {rightButton && <div>{rightButton}</div>}
            {isPassword && (
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-zinc-600 hover:text-zinc-800 cursor-pointer"
                disabled={isTransulent}
              >
                {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
