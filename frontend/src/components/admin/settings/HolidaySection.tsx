"use client";

import React from 'react';
import InputField from '@/components/InputField';
import { IconTrashFilled } from '@tabler/icons-react';

interface HolidaySectionProps {
  index: number;
  name: string;
  date: string;
  onChange: (updated: { name: string; date: string }) => void;
  onDeleteClick?: () => void;
}

export const HolidaySection: React.FC<HolidaySectionProps> = ({
  name,
  date,
  onChange,
  onDeleteClick,
}) => {
  return (
    <section className="flex flex-col px-3 py-6 w-full text-base rounded-lg bg-stone-50">
      <div className="flex justify-end">
        <button onClick={onDeleteClick} className="flex items-center gap-1 text-red-600 underline !text-xs !cursor-pointer">
          <IconTrashFilled size={14} />
          Delete
        </button>
      </div>

      <div className="flex flex-col text-zinc-600">
        <InputField
          label="Holiday Name"
          value={name}
          onChange={(e) => onChange({ name: e.target.value, date })}
          className="!py-0"
          isTransulent={false}
        />
        <InputField
          label="Holiday Date"
          type="date"
          value={date}
          onChange={(e) => onChange({ name, date: e.target.value })}
          className="!py-0"
          isTransulent={false}
        />
      </div>
    </section>
  );
};
