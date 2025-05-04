"use client";
import React, { useState } from "react";
import { CustomSelectTag } from "../../common/CustomSelectTag";
import InputField from "@/components/InputField";



export const ConfigurationTabSection: React.FC = () => {

    const [teamName, setTeamName] = useState("1st Semester");

    const options = [
        { value: "academic-year", label: "Academic Year" },
        { value: "academic-term", label: "Academic Term" },
        { value: "academic-semester", label: "Academic Semester" },
    ];

    const handleAcademicCalendarChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        console.log("Selected academic calendar:", selectedValue);
        // Handle the change as needed, e.g., update state or make an API call
    };


  return (
    <div className="pb-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">Academic Calendar</h1>
        <CustomSelectTag options={options} onOptionItemClick={handleAcademicCalendarChange} />

        <p className="text-xs text-[#878787] my-5">2024/2025 Academic Year</p>
        <h1 className="text-md font-semibold text-neutral-800 my-2">Terms</h1>
        <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-4">
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

        <hr className="my-5 border-t-1 border-[#909090]" />

        <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-8">
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
 