"use client";
import React from 'react'
import Image from "next/image";
import ProfileLogo from '@/images/admission-profile-logo.svg'
import InputField from '../InputField';
import CustomButton from '../Button';


const StudentInformationStep: React.FC = () => {

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
                    <p className="text-xs mb-1 text-[#52525c]">Upload Recent Headshot</p>
                    <CustomButton variant="outline" className="!py-1" text="Choose file" onClick={() => {}} />
                </div>
                <div />
                <InputField
                    label="First Name"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Last Name"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Other Names"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Email"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Date of Birth"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Place of Birth"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Gender"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Nationality"
                    isTransulent={false}
                    value={''}
                />
                <div>
                    <p className="text-xs mb-1 text-[#52525c]">Upload Birth Certification</p>
                    <CustomButton variant="outline" className="!py-1" text="Choose file" onClick={() => {}} />
                </div>
                <InputField
                    label="Religion"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Languages Spoken"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Street Address"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Box Address"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Phone"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Anticipated Academic Year"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="For Class"
                    isTransulent={false}
                    value={''}
                />
            </div>
        </div>
    </div>
  )
}

export default StudentInformationStep;