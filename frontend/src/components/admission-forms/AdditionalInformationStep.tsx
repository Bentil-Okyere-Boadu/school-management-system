"use client";
import React, { useState } from 'react'
import Image from "next/image";
import HomeIcon from "@/images/admission-home-logo.svg"
import InputField from '../InputField';
import CustomButton from '../Button';
import { Select } from '@mantine/core';


const AdditionalInformationStep: React.FC = () => {
  const [hasAcademicHistory, setHasAcademicHistory] = useState<string>('no');
  const academicHistoryOptions = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  const handleDurationChange = (value: string | null) => {
    setHasAcademicHistory(value ?? "no");
  };

  return (
    <div>
      <div className='mt-14 mb-8 mx-auto'>
        <div className='flex flex-col items-center'>
          <Image
              src={HomeIcon}
              width={100}
              height={100}
              alt="User Avatar"
              className="w-15 h-15 rounded-full object-cover"
          />
          <h3 className="font-bold mt-4 mb-2">Additional Information</h3>
          <p className='text-sm text-center'>Please provide any additional information to complete your application. This helps us better understand your needs and process your admission smoothly.</p>
        </div>

        <h3 className="font-bold mt-8 text-center">Home Survery</h3>
        <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 my-3">
          <InputField
              label="What is the primary language used in the home?"
              isTransulent={false}
              value={''}
          />
          <InputField
              label="What is the first language most often used by the student?"
              isTransulent={false}
              value={''}
          />
        </div>

        <h3 className="font-bold mb-3 text-center">Academic History</h3>
        <div className="flex justify-center">
          <div className="w-full md:w-[calc(55%-0.75rem)]">
            <Select
              label="Did the applicant attend another school before this?"
              data={academicHistoryOptions}
              value={hasAcademicHistory}
              onChange={handleDurationChange}
            />
          </div>
        </div>

        {hasAcademicHistory === "yes" && (
          <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-8">
              <InputField
                  label="School Name"
                  isTransulent={false}
                  value={''}
              />
              <InputField
                  label="School URL"
                  isTransulent={false}
                  value={''}
              />
              <InputField
                  label="Street Address"
                  isTransulent={false}
                  value={''}
              />
              <InputField
                  label="City"
                  isTransulent={false}
                  value={''}
              />
              <InputField
                  label="State"
                  isTransulent={false}
                  value={''}
              />
              <InputField
                  label="Country"
                  isTransulent={false}
                  value={''}
              />
              <InputField
                  label="Attended From"
                  isTransulent={false}
                  value={''}
              />
              <InputField
                  label="Attended To"
                  isTransulent={false}
                  value={''}
              />
              <InputField
                  label="Grade / Class"
                  isTransulent={false}
                  value={''}
              />
              <div>
                  <p className="text-xs mb-1.5 text-[#52525c]">Upload Previous Report Cards(at least 3 in pdf, png or jpeg )</p>
                  <CustomButton variant="outline" className="!py-1" text="Choose file" onClick={() => {}} />
              </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdditionalInformationStep;