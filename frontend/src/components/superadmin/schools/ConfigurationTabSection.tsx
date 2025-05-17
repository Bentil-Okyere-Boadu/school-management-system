"use client";
import React, { useState } from "react";
import { CustomSelectTag } from "../../common/CustomSelectTag";
import InputField from "@/components/InputField";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";


export const ConfigurationTabSection: React.FC = () => {
    const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState('')
    const options = [
        { value: "academic-year", label: "Academic Year" },
        { value: "academic-term", label: "Academic Term" },
        { value: "academic-semester", label: "Academic Semester" },
    ];

    const terms = [
        {
            name: "1st Semester",
            startDate: "5th January 2025",
            endDate: "5th January 2026",
            holidaysInTerm: "Yes",
            holidays: [
                { name: "Easter", date: "20th April 2024" }
            ]
        },
        {
            name: "2nd Semester",
            startDate: "10th June 2025",
            endDate: "5th January 2026",
            holidaysInTerm: "Yes",
            holidays: [
                { name: "Independence Day", date: "4th July 2025" },
                { name: "Summer Break", date: "1st August 2025" }
            ]
        }
    ];


    const handleAcademicCalendarChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedAcademicCalendar(selectedValue)
    };


  return (
    <div className="pb-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">Academic Calendar</h1>
        <CustomSelectTag options={options} value={selectedAcademicCalendar} onOptionItemClick={handleAcademicCalendarChange} />

        <p className="text-xs text-[#878787] my-5">2024/2025 Academic Year</p>
        <h1 className="text-md font-semibold text-neutral-800 my-2">Terms</h1>
        {
            terms.map((term, index, arrayList) => (
                <div key={index}>
                    <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-4">
                        <InputField
                            label="Team Name"
                            isTransulent={true}
                            value={term.name}
                            onChange={() => {}}
                        />
                        <InputField
                            label="Start Date"
                            isTransulent={true}
                            value={term.startDate}
                            onChange={() => {}}
                        />
                        <InputField
                            label="End Date"
                            isTransulent={true}
                            value={term.endDate}
                            onChange={() => {}}
                        />
                        <InputField
                            label="Are there holidays in this term?"
                            isTransulent={true}
                            value={term.holidaysInTerm}
                            onChange={() => {}}
                        />
                        {
                            term.holidays.map((holiday, hIndex) => (
                                <div key={hIndex} className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <InputField
                                        label="Holiday Name"
                                        isTransulent={true}
                                        value={holiday.name}
                                        onChange={() => {}}
                                    />
                                    <InputField
                                        label="Holiday Date"
                                        isTransulent={true}
                                        value={holiday.date}
                                        onChange={() => {}}
                                    />
                                </div>
                            ))
                        }
                    </div>

                    {index < arrayList.length - 1 && (
                        <hr className="mt-5 mb-7 border-t-1 border-[#909090]" />
                    )}
                </div>
            ))
        }

        {terms?.length === 0 && (
            <NoAvailableEmptyState message="No terms available yet." />
        )}
    </div>
  );
};
 