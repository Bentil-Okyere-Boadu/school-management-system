"use client";

import React, { useRef, useState } from 'react';
import { IconX } from '@tabler/icons-react';

interface FileUploadAreaProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  accept = 'image/*',
  multiple = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles).filter(file =>
      file.type.startsWith('image/')
    );

    const newFiles = multiple ? [...files, ...fileArray] : fileArray;

    setFiles(newFiles);
    onFileSelect(newFiles);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemove = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    onFileSelect(updatedFiles);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-md px-6 py-6 text-center transition-colors cursor-pointer relative ${
        isDragging ? 'bg-gray-100 border-blue-400' : 'bg-white border-gray-400'
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      {files.length > 0 ? (
        <div className="flex flex-wrap gap-4 justify-center">
          {files.map((file, index) => (
            <div key={index} className="relative w-24 h-24">
              <img
                src={URL.createObjectURL(file)}
                alt={`preview-${index}`}
                className="w-full h-full object-cover rounded-md"
              />
              <button
                type="button"
                aria-label="Remove image"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="absolute top-1 right-1 bg-white rounded-full p-1 text-gray-700 shadow hover:text-red-500"
              >
                <IconX size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm py-5">
          {isDragging
            ? 'Drop file here...'
            : 'Click or drag file here to upload.'}
        </p>
      )}
    </div>
  );
};

export default FileUploadArea;
