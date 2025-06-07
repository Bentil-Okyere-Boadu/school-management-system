"use client";
import React from 'react'
import InputField from '../InputField';
import Image from "next/image";
import DocumentItem from '../common/DocumentItem';
import { Guardian, StudentInformation, AdditionalInformation } from '@/@types';
import { TagsInput } from '@mantine/core';

interface PreviewStepProps {
  formData: {
    studentData: StudentInformation;
    guardians: Guardian[];
    additionalInfo: AdditionalInformation;
  };
}


const PreviewStep: React.FC<PreviewStepProps> = ({ formData }) => {

  const { studentData, guardians, additionalInfo } = formData;

  return (
    <div>
        <div className='mt-2 mx-auto'>
            <h3 className="text-[20px] font-bold mt-4 mb-6 text-center">Preview</h3>
            
            <h4 className="font-bold mt-2 text-center">Student Information</h4>
            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-2">
                <div className='mb-2'>
                  <p className="text-xs mb-2 text-[#52525c]">Upload Recent Headshot<span className="text-red-500 ml-0.5">*</span></p>
                  { studentData?.headshotFile && (<Image
                    src={URL.createObjectURL(studentData?.headshotFile)}
                    width={100}
                    height={100}
                    alt="User Avatar"
                    className="w-16 h-16 object-cover rounded-full"
                  />)}
                </div>
                <div />
                <InputField
                    label="First Name"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.firstName}
                />
                <InputField
                    label="Last Name"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.lastName}
                />
                <InputField
                    label="Other Names"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.otherNames}
                />
                <InputField
                    label="Email"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.email}
                />
                <InputField
                    label="Date of Birth"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.dateOfBirth}
                />
                <InputField
                    label="Place of Birth"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.placeOfBirth}
                />
                <InputField
                    label="Gender"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.gender}
                />
                <InputField
                    label="Nationality"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.nationality}
                />
                <InputField
                    label="Upload Birth Certificate"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Religion"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.religion}
                />
                <TagsInput
                    label="Languages Spoken"
                    required
                    readOnly
                    className="-mt-2 mb-2 sm:mb-0"
                    classNames={{
                        input: '!border-[0px] !bg-[#8787871A]',
                        pill: '!bg-[#fff] !text-black', 
                    }}
                    value={studentData?.languagesSpoken}
                />
                <InputField
                    label="Street Address"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.streetAddress}
                />
                <InputField
                    label="Box Address"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.boxAddress}
                />
                <InputField
                    label="Phone"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.phone}
                />
                <InputField
                    label="Anticipated Academic Year"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.academicYear}
                />
                <InputField
                    label="For Class"
                    required
                    isTransulent={true}
                    readOnly={true}
                    value={studentData.classFor}
                />
            </div>

            <h4 className="font-bold mt-6 text-center">Family Information</h4>
            {guardians.map((guardian, idx) => (
                <div key={idx} className="mt-6">
                    <h4 className='font-bold mb-0.5'>Guardian {idx + 1}</h4>
                    <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2">
                        <div className='mb-2'>
                            <p className="text-xs mb-2 text-[#52525c]">Upload Recent Headshot<span className="text-red-500 ml-0.5">*</span></p>
                            { guardian?.headshotFile && (<Image
                                src={URL.createObjectURL(guardian?.headshotFile)}
                                width={100}
                                height={100}
                                alt="guardian avatar"
                                className="w-16 h-16 object-cover rounded-full"
                            />)}
                        </div>
                        <div />
                        <InputField
                            label="First Name"
                            required
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.firstName}
                        />
                        <InputField
                            label="Last Name"
                            required
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.lastName}
                        />
                        <InputField
                            label="Relationshop to applicant"
                            required
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.relationship}
                        />
                        <InputField
                            label="Email"
                            required
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.email}
                        />
                        <InputField
                            label="Nationality"
                            required
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.nationality}
                        />
                        <InputField
                            label="Occupation"
                            required
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.occupation}
                        />
                        <InputField
                            label="Company"
                            required
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.company}
                        />
                        <InputField
                            label="Street Address"
                            required
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.streetAddress}
                        />
                        <InputField
                            label="Box Address"
                            required
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.boxAddress}
                        />
                        <InputField
                            label="Phone"
                            required
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.phone}
                        />
                        <InputField
                            label="Optional Phone"
                            isTransulent={true}
                            readOnly={true}
                            value={guardian.optionalPhone}
                        />
                    </div>
              </div>
            ))}

            <h4 className="font-bold mt-6 text-center">Additional Information</h4>
            <h5 className="font-bold mt-6 text-center">Home Survey</h5>
            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 my-3">
              <InputField
                  label="What is the primary language used in the home?"
                  required
                  isTransulent={true}
                  readOnly={true}
                  value={additionalInfo?.primaryHomeLanguage}
              />
              <InputField
                  label="What is the first language most often used by the student?"
                  required
                  isTransulent={true}
                  readOnly={true}
                  value={additionalInfo?.studentPrimaryLanguage}
              />
            </div>
            <h5 className="font-bold mt-6 text-center">Academic History</h5>
            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 my-3">
              <InputField
                  label="Did the applicant attend another school before this?"
                  required
                  isTransulent={true}
                  readOnly={true}
                  value={additionalInfo?.hasAcademicHistory === 'yes' ? 'Yes' : 'No'}
              />
            </div>

            {additionalInfo.hasAcademicHistory === 'yes' && (
                <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2">
                    <InputField
                        label="School Name"
                        required
                        isTransulent={true}
                        readOnly={true}
                        value={additionalInfo?.previousSchool?.name}
                    />
                    <InputField
                        label="School URL"
                        required
                        isTransulent={true}
                        readOnly={true}
                        value={additionalInfo?.previousSchool?.url}
                    />
                    <InputField
                        label="Street Address"
                        required
                        isTransulent={true}
                        readOnly={true}
                        value={additionalInfo?.previousSchool?.street}
                    />
                    <InputField
                        label="City"
                        required
                        isTransulent={true}
                        readOnly={true}
                        value={additionalInfo?.previousSchool?.city}
                    />
                    <InputField
                        label="State"
                        required
                        isTransulent={true}
                        readOnly={true}
                        value={additionalInfo?.previousSchool?.state}
                    />
                    <InputField
                        label="Country"
                        required
                        isTransulent={true}
                        readOnly={true}
                        value={additionalInfo?.previousSchool?.country}
                    />
                    <InputField
                        label="Attended From"
                        isTransulent={true}
                        readOnly={true}
                        value={additionalInfo?.previousSchool?.attendedFrom}
                    />
                    <InputField
                        label="Attended To"
                        isTransulent={true}
                        readOnly={true}
                        value={additionalInfo?.previousSchool?.attendedTo}
                    />
                    <InputField
                        label="Grade / Class"
                        required
                        isTransulent={true}
                        readOnly={true}
                        value={additionalInfo?.previousSchool?.grade}
                    />
                    <div>
                        <p className="text-xs mb-1.5 text-[#52525c]">Upload Previous Report Cards (at least 3 in pdf, png or jpeg)<span className="text-red-500 ml-0.5">*</span></p>
                        <div className="flex gap-3 flex-wrap">
                            {additionalInfo?.previousSchool?.reportCards?.map((doc) => (
                                <DocumentItem
                                    key={`${doc.name}-${doc.lastModified}`}
                                    name={doc.name}
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

export default PreviewStep;