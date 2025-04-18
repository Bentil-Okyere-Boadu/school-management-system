import React from 'react'

interface ButtonProps {
    text: string,
    onClick: () => void
}
const CustomButton = ({text, onClick}: ButtonProps) => {
    return (
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded cursor-pointer w-fit max-sm:px-2 max-sm:py-1 max-sm:w-full max-sm:text-sm"
          aria-label={text}
          onClick={onClick}
        >
          {text}
        </button>
      );
}

export default CustomButton
