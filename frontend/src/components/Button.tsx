import React from 'react'

interface ButtonProps {
    text: string,
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
}
const CustomButton = ({text, onClick, disabled, loading = false}: ButtonProps) => {
    return (
        <button
          className={`px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded cursor-pointer w-fit max-sm:px-2 max-sm:py-1 max-sm:w-full max-sm:text-sm
            ${ loading ? "opacity-65" : ""}
          `}
          aria-label={text}
          onClick={onClick}
          disabled={disabled || loading}
        >
          {text}
        </button>
      );
}

export default CustomButton
