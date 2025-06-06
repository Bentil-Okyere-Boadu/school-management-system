"use client";
import React from 'react'
import InputField from '../InputField';
import CustomButton from '../Button';
import Image from "next/image";
import HomeIcon from "@/images/admission-home-logo.svg"


const FamilyInformationStep: React.FC = () => {

  return (
    <div>
        <div className='mt-14 mx-auto'>
            <div className='flex flex-col items-center'>
                <Image
                    src={HomeIcon}
                    width={100}
                    height={100}
                    alt="User Avatar"
                    className="w-15 h-15 rounded-full object-cover"
                />
                <h3 className="font-bold mt-4 mb-2">Family Information</h3>
                <p className='text-sm text-center'>Please provide your family information to support your application. This helps us process your application accurately and keep your guardians informed about your admission status.</p>
                <h4 className="font-bold mt-4">Guardian 1</h4>
            </div>

            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-6">
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
                    label="Relationshop to applicant"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Email"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Nationality"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Occupation"
                    isTransulent={false}
                    value={''}
                />
                <InputField
                    label="Company"
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
                    label="Optional Phone"
                    isTransulent={false}
                    value={''}
                />
            </div>
        </div>
    </div>
  )
}

export default FamilyInformationStep;