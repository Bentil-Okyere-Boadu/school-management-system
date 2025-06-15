import React from 'react';

interface ButtonProps {
  text?: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
  className?: string;
  icon?: React.ReactNode;
  hideText?: boolean;
}

const CustomButton = ({
  text,
  onClick,
  disabled,
  loading = false,
  variant = 'solid',
  className,
  icon,
  hideText = false,
}: ButtonProps) => {
  const baseStyles = `
    px-4 py-2 text-sm font-medium rounded cursor-pointer w-fit
    max-sm:px-2 max-sm:py-1 max-sm:w-full max-sm:text-sm
    transition-all duration-150 ease-in-out flex items-center justify-center gap-2
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
      aria-label={text || 'button'}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {!hideText && text}
    </button>
  );
};

export default CustomButton;
