"use client";
import React, { useRef } from 'react'
import Image from "next/image";
import HomeIcon from "@/images/admission-home-logo.svg"
import InputField from '../InputField';
import CustomButton from '../Button';
import { Select } from '@mantine/core';
import { AdditionalInformation } from '@/@types';
import DocumentItem from '../common/DocumentItem';

interface AdditionalInfoProps {
  additionalInfo: AdditionalInformation;
  setAdditionalInfo: React.Dispatch<React.SetStateAction<AdditionalInformation>>;
}

  const AdditionalInformationStep: React.FC<AdditionalInfoProps> = ({ additionalInfo, setAdditionalInfo }) => {
  const academicHistoryOptions = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (field: keyof AdditionalInformation, value: string) => {
    setAdditionalInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const selectedFiles = Array.from(files); // Convert FileList to array

      // Combine with existing files
      handlePreviousSchoolChange("reportCards", [
        ...(additionalInfo?.previousSchool?.reportCards ?? []),
        ...selectedFiles,
      ]);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    const currentFiles = additionalInfo.previousSchool?.reportCards ?? [];
    const updatedFiles = currentFiles.filter(file => file !== fileToRemove);
    handlePreviousSchoolChange("reportCards", updatedFiles);
  };

  
  const handlePreviousSchoolChange = (field: keyof NonNullable<AdditionalInformation["previousSchool"]>, value: string | File[]) => {
    setAdditionalInfo((prev) => ({
      ...prev,
      previousSchool: {
        name: prev.previousSchool?.name ?? "",
        url: prev.previousSchool?.url ?? "",
        street: prev.previousSchool?.street ?? "",
        city: prev.previousSchool?.city ?? "",
        state: prev.previousSchool?.state ?? "",
        country: prev.previousSchool?.country ?? "",
        attendedFrom: prev.previousSchool?.attendedFrom ?? "",
        attendedTo: prev.previousSchool?.attendedTo ?? "",
        grade: prev.previousSchool?.grade ?? "",
        reportCards: prev.previousSchool?.reportCards ?? [],
        [field]: value,
      },
    }));
  };

  const handleAcademicHistoryChange = (val: string) => {
    if(val === 'no'){
      setAdditionalInfo((prev) => ({
        ...prev,
        previousSchool: undefined
      }));
    }
  }

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
              required
              value={additionalInfo.primaryHomeLanguage}
              onChange={(e) => handleChange("primaryHomeLanguage", e.target.value)}
          />
          <InputField
              label="What is the first language most often used by the student?"
              isTransulent={false}
              required
              value={additionalInfo.studentPrimaryLanguage}
              onChange={(e) => handleChange("studentPrimaryLanguage", e.target.value)}
          />
        </div>

        <h3 className="font-bold mb-3 text-center">Academic History</h3>
        <div className="flex justify-center">
          <div className="w-full md:w-[calc(55%-0.75rem)]">
            <Select
              required
              label="Did the applicant attend another school before this?"
              data={academicHistoryOptions}
              value={additionalInfo.hasAcademicHistory}
              onChange={(value) => {
                handleChange("hasAcademicHistory", value ?? "no")
                handleAcademicHistoryChange(value ?? "no");
              }}
            />
          </div>
        </div>

        {additionalInfo?.hasAcademicHistory === "yes" && (
          <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-8">
            <InputField
                label="School Name"
                required
                isTransulent={false}
                value={additionalInfo?.previousSchool?.name}
                onChange={(e) =>
                  handlePreviousSchoolChange("name", e.target.value)
                }
            />
            <InputField
                label="School URL"
                isTransulent={false}
                value={additionalInfo?.previousSchool?.url}
                onChange={(e) =>
                  handlePreviousSchoolChange("url", e.target.value)
                }
            />
            <InputField
                label="Street Address"
                required
                isTransulent={false}
                value={additionalInfo?.previousSchool?.street}
                onChange={(e) =>
                  handlePreviousSchoolChange("street", e.target.value)
                }
            />
            <InputField
                label="City"
                required
                isTransulent={false}
                value={additionalInfo?.previousSchool?.city}
                onChange={(e) =>
                  handlePreviousSchoolChange("city", e.target.value)
                }
            />
            <InputField
                label="State"
                required
                isTransulent={false}
                value={additionalInfo?.previousSchool?.state}
                onChange={(e) =>
                  handlePreviousSchoolChange("state", e.target.value)
                }
            />
            <InputField
                label="Country"
                required
                isTransulent={false}
                value={additionalInfo?.previousSchool?.country}
                onChange={(e) =>
                  handlePreviousSchoolChange("country", e.target.value)
                }
            />
            <InputField
                label="Attended From"
                isTransulent={false}
                value={additionalInfo?.previousSchool?.attendedFrom}
                onChange={(e) =>
                  handlePreviousSchoolChange("attendedFrom", e.target.value)
                }
            />
            <InputField
                label="Attended To"
                isTransulent={false}
                value={additionalInfo?.previousSchool?.attendedTo}
                onChange={(e) =>
                  handlePreviousSchoolChange("attendedTo", e.target.value)
                }
            />
            <InputField
                label="Grade / Class"
                required
                isTransulent={false}
                value={additionalInfo?.previousSchool?.grade}
                onChange={(e) =>
                  handlePreviousSchoolChange("grade", e.target.value)
                }
            />
            <div>
              <p className="text-xs mb-1.5 text-[#52525c]">Upload Previous Report Cards (at least 1 in pdf, png or jpeg )<span className="text-red-500 ml-0.5">*</span></p>
              <input
                type="file"
                multiple
                accept=".pdf, .png, .jpg, .jpeg"
                id="report-cards"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  handleFileChange(e.target.files);

                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              />

              <CustomButton
                variant="outline"
                className="!py-1"
                text="Choose files"
                onClick={() => document.getElementById('report-cards')?.click()}
              />
              <div className="flex gap-3 flex-wrap mt-1">
                {additionalInfo?.previousSchool?.reportCards?.map((doc) => (
                  <DocumentItem
                    key={`${doc.name}-${doc.lastModified}`}
                    name={doc.name}
                    onCardClick={() => {}}
                    onClose={() => {handleRemoveFile(doc)}}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdditionalInformationStep;