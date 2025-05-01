import React, { ReactNode, useEffect } from 'react';
import CustomButton from '../Button';

interface DialogProps {
  isOpen: boolean;
  saveButtonText?: string;
  dialogTitle: string;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
  backdropOpacity?: number;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  saveButtonText = 'Save',
  dialogTitle,
  onClose,
  onSave,
  children,
  backdropOpacity = 0.7,
}) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.classList.add('overflow-hidden');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: `rgba(217, 217, 217, ${backdropOpacity})` }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white border-1 border-[#AB58E7] rounded-xl shadow-lg p-5 z-50 max-h-[90vh] flex flex-col w-[568px] max-w-[569px] mx-2">
        {/* Dialog Header */}
        <div className='flex items-center justify-between'>
            <h1 className='font-semibold text-xl'>{dialogTitle}</h1>
            <button
                aria-label="Close"
                onClick={onClose}
                className="cursor-pointer"
            >
                <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/3d67b4124620e741e53198469b4e02b4659baa11?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab"
                className="object-contain shrink-0 self-start w-3 aspect-square"
                alt="Close"
                />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 mb-2">
            {children} {/* Large content goes here */}
        </div>

        {/* Dialog Footer */}
        <div className='flex justify-end items-center gap-4'>
            <button
                aria-label="Close"
                onClick={onClose}
                className="cursor-pointer text-sm"
            > Cancel
            </button>
            <CustomButton
                text={saveButtonText}
                onClick={onSave}
            />
        </div>
      </div>
    </div>
  );
};

