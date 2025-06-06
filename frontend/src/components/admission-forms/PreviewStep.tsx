"use client";
import React from 'react'
import InputField from '../InputField';
import Image from "next/image";
import ProfilePic from "@/images/no-profile-img.png"
import DocumentItem from '../common/DocumentItem';


const PreviewStep: React.FC = () => {
  return (
    <div>
        <div className='mt-14 mx-auto'>
            <h3 className="text-[20px] font-bold mt-4 mb-6 text-center">Preview</h3>
            
            <h4 className="font-bold mt-2 text-center">Student Information</h4>
            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-2">
                <div className='mb-2'>
                  <p className="text-xs mb-2 text-[#52525c]">Upload Recent Headshot</p>
                  <Image
                    src={ProfilePic}
                    width={100}
                    height={100}
                    alt="User Avatar"
                    className="w-20 h-20  object-cover"
                  />
                </div>
                <div />
                <InputField
                    label="First Name"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Last Name"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Other Names"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Email"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Date of Birth"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Place of Birth"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Gender"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Nationality"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Upload Birth Certificate"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Religion"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Languages Spoken"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Street Address"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Box Address"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Phone"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Anticipated Academic Year"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="For Class"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
            </div>

            <h4 className="font-bold mt-6 text-center">Family Information</h4>
            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-6">
                <div className='mb-2'>
                  <p className="text-xs mb-2 text-[#52525c]">Upload Recent Headshot</p>
                  <Image
                    src={ProfilePic}
                    width={100}
                    height={100}
                    alt="User Avatar"
                    className="w-20 h-20  object-cover"
                  />
                </div>
                <div />
                <InputField
                    label="First Name"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Last Name"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Relationshop to applicant"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Email"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Nationality"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Occupation"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Company"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Street Address"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Box Address"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Phone"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
                <InputField
                    label="Optional Phone"
                    isTransulent={true}
                    readOnly={true}
                    value={''}
                />
            </div>

            <h4 className="font-bold mt-6 text-center">Additional Information</h4>
            <h5 className="font-bold mt-6 text-center">Home Survey</h5>
            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 my-3">
              <InputField
                  label="What is the primary language used in the home?"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
              <InputField
                  label="What is the first language most often used by the student?"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
            </div>
            <h5 className="font-bold mt-6 text-center">Academic History</h5>
            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 my-3">
              <InputField
                  label="Did the applicant attend another school before this?"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
            </div>
            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2">
              <InputField
                  label="School Name"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
              <InputField
                  label="School URL"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
              <InputField
                  label="Street Address"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
              <InputField
                  label="City"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
              <InputField
                  label="State"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
              <InputField
                  label="Country"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
              <InputField
                  label="Attended From"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
              <InputField
                  label="Attended To"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
              <InputField
                  label="Grade / Class"
                  isTransulent={true}
                  readOnly={true}
                  value={''}
              />
              <div>
                  <p className="text-xs mb-1.5 text-[#52525c]">Upload Previous Report Cards(at least 3 in pdf, png or jpeg )</p>
                  <div className="flex gap-3 flex-wrap">
                    {[1, 2, 3]?.map((doc) => (
                        <DocumentItem
                          key={doc}
                          name={`Document stuff ${doc}`}
                          onCardClick={() => {}}
                        />
                    ))}
                  </div>
              </div>
          </div>

        </div>
    </div>
  )
}

export default PreviewStep;