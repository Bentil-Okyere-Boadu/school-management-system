"use client";

import React from 'react';
import InputField from '@/components/InputField';
import { IconTrashFilled } from '@tabler/icons-react';

interface HolidaySectionProps {
  showDelete?: boolean;
   onDeleteClick?: () => void;
}

export const HolidaySection: React.FC<HolidaySectionProps> = ({ showDelete = true, onDeleteClick }) => {
  return (
    <section className="flex overflow-hidden flex-col px-3 py-6 w-full text-xs rounded-lg bg-stone-50">
      {showDelete && (
        <div onClick={() => onDeleteClick?.()} className="flex gap-1 self-end mr-3 underline whitespace-nowrap text-zinc-500 max-md:mr-2.5 cursor-pointer">
            <IconTrashFilled size={14} className="text-red-600" />
          <button className="z-10 self-start cursor-pointer">
            Delete
          </button>
        </div>
      )}
      <div className="flex flex-col w-full text-zinc-600">
        <InputField
            className="!py-0"
            placeholder=""
            label="Holiday Name"
            value={''}
            onChange={() => {}}
            isTransulent={false}
        />
        <InputField
            className="!py-0"
            placeholder=""
            label="Holiday Date"
            value={''}
            type="date"
            onChange={() => {}}
            isTransulent={false}
        />
      </div>
    </section>
  );
};
