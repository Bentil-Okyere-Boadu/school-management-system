import Image from "next/image";
import { useParams } from "next/navigation";
import NoProfileImg from "@/images/ProfilePic.jpg";
import React from "react";
import InputField from "@/components/InputField";

const StudentProfile = () => {
  const { id } = useParams();
  return (
    <div>
      <div>
        {/* Personal Information */}
        <div className="w-full flex flex-col justify-center">
          <h3 className="font-bold mb-3">Personal Information</h3>
          <Image
            src={NoProfileImg.src}
            width={160}
            height={130}
            alt="studentProfilePic"
            className="rounded-[8px]"
          />
        </div>

        {/* Bio Data */}
        <div className="mt-15 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InputField
            className="!py-0"
            label="First Name"
            isTransulent={true}
          />
          <InputField className="!py-0" label="Last Name" isTransulent={true} />
          <InputField
            className="!py-0"
            label="Other Names"
            isTransulent={true}
          />
          <InputField className="!py-0" label="Gender" isTransulent={true} />
          <InputField
            className="!py-0"
            label="Date of Birth"
            type="Date"
            isTransulent={true}
          />
          <InputField
            className="!py-0"
            label="Place of Birth"
            isTransulent={true}
          />
          <InputField
            className="!py-0"
            label="Email"
            type="Email"
            isTransulent={true}
          />
        </div>

        {/* Academic Information */}
        <div className="mt-15">
          <h3 className="font-bold mb-3">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <InputField className="!py-0" label="Grade" isTransulent={true} />
            <InputField
              className="!py-0"
              label="Student ID"
              value={id as string}
              isTransulent={true}
            />
          </div>
        </div>
        
        {/* Parent/Guardian Information */}
        <div className="mt-15">
          <h3 className="font-bold mb-3">Parent/Guardian Information</h3>
          <div>
            <h4 className="font-bold mb-3">Guardian #1</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <InputField className="!py-0" label="First Name" isTransulent={true} />
                <InputField className="!py-0" label="Last Name" isTransulent={true} />
                <InputField className="!py-0" label="Relationship with student" isTransulent={true} />
                <InputField className="!py-0" label="Occupation" isTransulent={true} />
                <InputField className="!py-0" label="Email" isTransulent={true} />
                <InputField className="!py-0" label="Street Address" isTransulent={true} />
                <InputField className="!py-0" label="Box Address" isTransulent={true} />
                <InputField className="!py-0" label="Phone" isTransulent={true} />
                <InputField className="!py-0" label="Phone(Optional)" isTransulent={true} />
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-3">Guardian #2</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <InputField className="!py-0" label="First Name" isTransulent={true} />
                <InputField className="!py-0" label="Last Name" isTransulent={true} />
                <InputField className="!py-0" label="Relationship with student" isTransulent={true} />
                <InputField className="!py-0" label="Occupation" isTransulent={true} />
                <InputField className="!py-0" label="Email" isTransulent={true} />
                <InputField className="!py-0" label="Street Address" isTransulent={true} />
                <InputField className="!py-0" label="Box Address" isTransulent={true} />
                <InputField className="!py-0" label="Phone" isTransulent={true} />
                <InputField className="!py-0" label="Phone(Optional)" isTransulent={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
