"use client";
import React from 'react'
import Image from "next/image";
import ProfileLogo from '@/images/admission-profile-logo.svg'
import InputField from '../InputField';
import CustomButton from '../Button';
import { StudentInformation, ClassLevel } from '@/@types/index'
import { Select, TagsInput } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

interface StudentInfoProps {
  data: StudentInformation;
  setData: (data: StudentInformation) => void;
  classLevels: ClassLevel[]
}


const StudentInformationStep: React.FC<StudentInfoProps> = ({ data, setData, classLevels }) => {
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];
  
  const academicYearOptions = [
    { value: "2027", label: "2027" },
    { value: "2026", label: "2026" },
    { value: "2025", label: "2025" },
    { value: "2024", label: "2024" },
    { value: "2023", label: "2023" },
  ];

  const classLevelOptions = classLevels?.map((cl) => ({
    value: cl.id,
    label: cl.name
  }))

  const handleChange = (field: keyof StudentInformation, value: string | string[] | File) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div>
        <div className='mt-14 mx-auto'>
            <div className='flex flex-col items-center'>
                <Image
                    src={ProfileLogo}
                    width={100}
                    height={100}
                    alt="User Avatar"
                    className="w-15 h-15 rounded-full object-cover"
                />
                <h3 className="font-bold mt-4 mb-2">Student Information</h3>
                <p className='text-sm text-center'>Please provide your personal information to begin your application process. This information is essential for us to process your application and keep you updated on your admission status.</p>
            </div>

            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-10">
                <div>
                    <p className="text-xs mb-1 text-[#52525c]">Upload Recent Headshot<span className="text-red-500 ml-0.5">*</span></p>
                    {!data?.headshotFile ? (
                        <>
                            <input
                                type="file"
                                accept="image/*"
                                id={`student-headshot`}
                                className="hidden"
                                onChange={(e) => handleChange("headshotFile", e.target.files?.[0] || "")}
                            />
                            <CustomButton
                                variant="outline"
                                className="!py-1"
                                text="Choose file"
                                onClick={() =>
                                document.getElementById(`student-headshot`)?.click()
                                }
                            />
                        </>
                        ) : (
                        <div className="mt-2 relative inline-block">
                            <Image
                                src={URL.createObjectURL(data.headshotFile)}
                                width={100}
                                height={100}
                                alt="Headshot Preview"
                                className="w-14 h-14 rounded-full object-cover shrink-0"
                            />
                            <IconX
                                onClick={() => handleChange("headshotFile", "")}
                                size={24}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 bg-white rounded-full shadow p-1 hover:bg-red-100 cursor-pointer"
                            />
                        </div>
                    )}
                </div>
                {/* Code below occupies the right space */}
                <div />
                <InputField
                    label="First Name"
                    required
                    isTransulent={false}
                    value={data.firstName} onChange={(e) => handleChange('firstName', e.target.value)}
                />
                <InputField
                    label="Last Name"
                    required
                    isTransulent={false}
                    value={data.lastName} onChange={(e) => handleChange('lastName', e.target.value)}
                />
                <InputField
                    label="Other Names"
                    required
                    isTransulent={false}
                    value={data.otherNames} onChange={(e) => handleChange('otherNames', e.target.value)}
                />
                <InputField
                    label="Email"
                    required
                    isTransulent={false}
                    value={data.email} onChange={(e) => handleChange('email', e.target.value)}
                />
                <InputField
                    label="Date of Birth"
                    type="Date"
                    required
                    isTransulent={false}
                    value={data.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                />
                <InputField
                    label="Place of Birth"
                    required
                    isTransulent={false}
                    value={data.placeOfBirth} onChange={(e) => handleChange('placeOfBirth', e.target.value)}
                />
                <Select
                    required
                    label="Gender"
                    data={genderOptions}
                    value={data.gender}
                    className="-mt-2 mb-2 sm:mb-0"
                    onChange={(value) =>  handleChange('gender', value ?? '')}
                />
                <InputField
                    label="Nationality"
                    className='mt-4'
                    required
                    isTransulent={false}
                    value={data.nationality} onChange={(e) => handleChange('nationality', e.target.value)} 
                />
                <div className='mb-1'>
                    <p className="text-xs mb-1 text-[#52525c]">Upload Birth Certification<span className="text-red-500 ml-0.5">*</span></p>
                    {!data?.birthCertificateFile ? (
                        <>
                            <input
                                type="file"
                                accept="*"
                                id="birth-cert"
                                className="hidden"
                                onChange={(e) => handleChange("birthCertificateFile", e.target.files?.[0] || "")}
                            />
                            <CustomButton
                                variant="outline"
                                className="!py-1"
                                text="Choose file"
                                onClick={() =>
                                document.getElementById("birth-cert")?.click()
                                }
                            />
                        </>
                        ) : (
                        <div className="mt-2 relative inline-block">
                            {data.birthCertificateFile && (
                                <p className="text-md mt-1 text-green-600 font-bold"><span className='text-[#000]'>Selected:</span> {data.birthCertificateFile.name}</p>
                            )}
                            <IconX
                                onClick={() => handleChange("birthCertificateFile", "")}
                                size={24}
                                className="absolute -top-2 -right-0 text-red-500 bg-white rounded-full shadow p-1 hover:bg-red-100 cursor-pointer"
                            />
                        </div>
                    )}
                </div>
                <InputField
                    label="Religion"
                    required
                    isTransulent={false}
                    value={data.religion} onChange={(e) => handleChange('religion', e.target.value)}
                />
                <TagsInput
                    label="Languages Spoken"
                    required
                    placeholder="Press Enter after typing"
                    className="-mt-2 mb-2 sm:mb-0"
                    value={data.languagesSpoken}
                    onChange={(value) => handleChange('languagesSpoken', value)}
                />
                <InputField
                    label="Street Address"
                    required
                    isTransulent={false}
                    value={data.streetAddress} onChange={(e) => handleChange('streetAddress', e.target.value)}
                />
                <InputField
                    label="Box Address"
                    required
                    isTransulent={false}
                    value={data.boxAddress} onChange={(e) => handleChange('boxAddress', e.target.value)}
                />
                <InputField
                    label="Phone"
                    required
                    isTransulent={false}
                    value={data.phone} onChange={(e) => handleChange('phone', e.target.value)}
                />
                <Select
                    required
                    label="Anticipated Academic Year"
                    data={academicYearOptions}
                    value={data.academicYear}
                    onChange={(value) =>  handleChange('academicYear', value ?? '')}
                />
                <Select
                    required
                    label="For Class"
                    data={classLevelOptions}
                    value={data.classFor}
                    onChange={(value) =>  handleChange('classFor', value ?? '')}
                />
            </div>
        </div>
    </div>
  )
}

export default StudentInformationStep;