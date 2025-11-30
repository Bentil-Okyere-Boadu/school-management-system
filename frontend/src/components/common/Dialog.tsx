import React, { ReactNode, useEffect } from 'react';
import CustomButton from '../Button';
import { HashLoader } from 'react-spinners';
import { IconX } from '@tabler/icons-react';
import '../../app/globals.css'

interface DialogProps {
  isOpen: boolean;
  saveButtonText?: string;
  dialogTitle: string;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
  backdropOpacity?: number;
  busy?: boolean;
  subheader?: string;
  hideCancelButton?: boolean;
  dialogWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  saveButtonText = 'Save',
  dialogTitle,
  onClose,
  onSave,
  children,
  backdropOpacity = 0.7,
  busy = false,
  subheader= '',
  hideCancelButton = false,
  dialogWidth = 'w-[568px] max-w-[569px]',
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
      <div className={`bg-white border-1 border-[#AB58E7] rounded-xl shadow-lg py-5 px-1 z-50 max-h-[90vh] flex flex-col ${dialogWidth} mx-2 relative`}>
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10 dialogOpacity">
            <HashLoader color="#AB58E7" size={40} />
          </div>
        )}
        {/* Dialog Header */}
        <div className="flex items-center justify-between px-4">
          <h1 className="font-semibold text-xl">{dialogTitle}</h1>
          <button
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer"
          >
            <IconX stroke={2} />
          </button>
        </div>
        {subheader && (
          <div className='px-4 pb-2 text-sm text-gray-600'>{subheader}</div>
        )}

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 mb-2 px-4">
          {children} {/* Large content goes here */}
        </div>

        {/* Dialog Footer */}
        <div className="flex justify-end items-center gap-4 px-4">
          {!hideCancelButton &&(
          <button
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer text-sm"
          >
            {" "}
            Cancel
          </button>
          )}

          <CustomButton text={saveButtonText} onClick={onSave} />
        </div>
      </div>
    </div>
  );
};

