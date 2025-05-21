import React from 'react';

interface ButtonProps {
  text: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
  className?: string;
}

const CustomButton = ({
  text,
  onClick,
  disabled,
  loading = false,
  variant = 'solid',
  className,
}: ButtonProps) => {
  const baseStyles = `
    px-4 py-2 text-sm font-medium rounded cursor-pointer w-fit
    max-sm:px-2 max-sm:py-1 max-sm:w-full max-sm:text-sm
    transition-all duration-150 ease-in-out
  `;

  const solidStyles = `text-white bg-purple-500 hover:bg-purple-600`;
  const outlineStyles = `text-purple-600 border border-purple-600 hover:bg-purple-50`;

  const stateStyles = `${(loading || disabled) ? "opacity-50 cursor-not-allowed" : ""}`;

  return (
    <button
      className={`
        ${baseStyles}
        ${variant === 'outline' ? outlineStyles : solidStyles}
        ${stateStyles}
        ${className || ''}
      `}
      aria-label={text}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {text}
    </button>
  );
};

export default CustomButton;
