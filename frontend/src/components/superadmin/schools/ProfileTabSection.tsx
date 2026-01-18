"use client";
import React from "react";
import InputField from "@/components/InputField";
import SchoolCard from "../../common/SchoolCard";
import { School } from "@/@types";

interface ProfileTabSectionProps {
  schoolData: School
}

export const ProfileTabSection: React.FC<ProfileTabSectionProps> = ({ schoolData }) => {

  return (
    <div className="pb-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">School Profile</h1>
        <SchoolCard
            key="school-1"
            logoUrl={schoolData?.logoUrl}
            backgroundColor="bg-[#FFF]"
        />

        <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-10">
            <InputField
                label="Name"
                isTransulent={true}
                value={schoolData?.name}
            />
            <InputField
                label="Email"
                isTransulent={true}
                value={schoolData?.email}
            />
            <InputField
                label="Address"
                isTransulent={true}
                value={schoolData?.address}
            />
            <InputField
                label="Phone"
                isTransulent={true}
                value={schoolData?.phone}
            />
            <InputField
                label="School Code"
                isTransulent={true}
                value={schoolData?.schoolCode}
            />
        </div>
    </div>
  );
};
 