"use client";
import React, { useState } from "react";
import InputField from "@/components/InputField";
// import SchoolCard from "./SchoolCard";



export const ProfileTabSection: React.FC = () => {
    const [teamName, setTeamName] = useState("1st Semester");


  return (
    <div className="pb-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">Academic Calendar</h1>
        {/* <SchoolCard
            key="school-1"
            logoUrl="https://cdn.builder.io/api/v1/image/assets/TEMP/f33b143daa0a988b8358b2dd952c60f8aadfc974?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab"
            backgroundColor="bg-[#FFF]"
        /> */}

        <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-10">
            <InputField
                label="Team Name"
                isTransulent={true}
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
            />
            <InputField
                label="Team Name"
                isTransulent={true}
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
            />
            <InputField
                label="Team Name"
                isTransulent={true}
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
            />
            <InputField
                label="Team Name"
                isTransulent={true}
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
            />
            <InputField
                label="Team Name"
                isTransulent={true}
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
            />
            <InputField
                label="Team Name"
                isTransulent={true}
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
            />
        </div>
    </div>
  );
};
 