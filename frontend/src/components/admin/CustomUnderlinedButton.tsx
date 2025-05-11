import React from 'react';

interface CustomUnderlinedButtonProps {
  text: string;
  textColor?: string; // e.g., "text-blue-500"
  onClick: () => void;
  icon?: React.ReactNode;
  showIcon?: boolean;
}

const CustomUnderlinedButton: React.FC<CustomUnderlinedButtonProps> = ({
  text,
  textColor = 'text-purple-500',
  onClick,
  icon,
  showIcon = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex !text-xs items-center gap-1 underline  font-medium cursor-pointer ${textColor}`}
      aria-label={text}
    >
      {text}
      {showIcon && icon}
    </button>
  );
};

export default CustomUnderlinedButton;
