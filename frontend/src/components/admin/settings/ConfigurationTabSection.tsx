"use client";
import React, { useRef, useState } from "react";
import { CustomSelectTag } from "../../common/CustomSelectTag";
import InputField from "@/components/InputField";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import CustomUnderlinedButton from "../CustomUnderlinedButton";
import { Dialog } from "@/components/common/Dialog";
import { Select } from "@mantine/core";
import CustomButton from "@/components/Button";
import { HolidaySection } from "./HolidaySection";


export const ConfigurationTabSection: React.FC = () => {
    const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState('');
    const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
    const [selectedHolidaysInTerms, setSelectedHolidaysInTerms] = useState<string | null>('No');
    const [holidaySections, setHolidaySections] = useState<number[]>([]);
    const [holidayCounter, setHolidayCounter] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const holidaysInTermOptions = ['Yes', 'No'];
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

    const handleHolidaysInTermChange = (value: string | null) => {
        setSelectedHolidaysInTerms(value);
    }

    const handleAddHolidaySection = () => {
        setHolidaySections((prev) => [...prev, holidayCounter]);
        setHolidayCounter((prev) => prev + 1);

        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleDeleteHolidaySection = (idToDelete: number) => {
        setHolidaySections((prev) => prev.filter((id) => id !== idToDelete));
    };


  return (
    <>
        <div className="pb-8">
            <h1 className="text-md font-semibold text-neutral-800 mb-2">Academic Calendar</h1>
            <CustomSelectTag options={options} value={selectedAcademicCalendar} onOptionItemClick={handleAcademicCalendarChange} />

            <p className="text-xs text-[#878787] my-5">2024/2025 Academic Year</p>
            <div className="flex items-center gap-2">
            <h1 className="text-md font-semibold text-neutral-800">
                Terms
            </h1>
            <CustomUnderlinedButton
                text="Add New"
                textColor="text-purple-500"
                onClick={() => {setIsTermDialogOpen(true)}}
                showIcon={false}
            />
            </div>
            {
                terms.map((term, index, arrayList) => (
                    <div key={index}>
                        <div className="flex justify-end gap-3">
                            <CustomUnderlinedButton
                                text="Edit"
                                textColor="text-gray-500"
                                onClick={() => {setIsTermDialogOpen(true)}}
                                showIcon={false}
                            />
                            <CustomUnderlinedButton
                                text="Delete"
                                textColor="text-gray-500"
                                onClick={()=>{}}
                                showIcon={false}
                            />
                        </div>

                        <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2">
                            <InputField
                                label="Team Name"
                                isTransulent={false}
                                value={term.name}
                                onChange={() => {}}
                            />
                            <InputField
                                label="Start Date"
                                isTransulent={false}
                                value={term.startDate}
                                onChange={() => {}}
                            />
                            <InputField
                                label="End Date"
                                isTransulent={false}
                                value={term.endDate}
                                onChange={() => {}}
                            />
                            <InputField
                                label="Are there holidays in this term?"
                                isTransulent={false}
                                value={term.holidaysInTerm}
                                onChange={() => {}}
                            />
                            {
                                term.holidays.map((holiday, hIndex) => (
                                    <div key={hIndex} className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <InputField
                                            label="Holiday Name"
                                            isTransulent={false}
                                            value={holiday.name}
                                            onChange={() => {}}
                                        />
                                        <InputField
                                            label="Holiday Date"
                                            isTransulent={false}
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

        {/* Add New Term Dialog */}
        <Dialog
            isOpen={isTermDialogOpen}
            dialogTitle="Add New Term"
            saveButtonText="Save Term"
            onClose={() => {
                setIsTermDialogOpen(false);
            }}
            onSave={() => {}}
            busy={false}
        >
            <p className="text-xs text-gray-500">
                Enter the details for the academic year
            </p>
            <div className="my-3 flex flex-col gap-4">
                <InputField
                    className="!py-0"
                    placeholder="Enter Title"
                    label="Term Name"
                    value={''}
                    onChange={() => {}}
                    isTransulent={false}
                />
                <InputField
                    className="!py-0"
                    placeholder="Enter Date"
                    label="Start Date"
                    value={''}
                    type="date"
                    onChange={() => {}}
                    isTransulent={false}
                />
                <InputField
                    className="!py-0"
                    placeholder="Enter Date"
                    label="End Date"
                    value={''}
                    type="date"
                    onChange={() => {}}
                    isTransulent={false}
                />
                <Select
                    label="Are there holidays in this term?"
                    className="mb-2"
                    placeholder="Please Select"
                    data={holidaysInTermOptions}
                    value={selectedHolidaysInTerms}
                    onChange={handleHolidaysInTermChange}
                />
                {
                    selectedHolidaysInTerms == "Yes" &&
                        <CustomButton variant="outline" text="Add Holiday" onClick={handleAddHolidaySection} />
                }

                {holidaySections.map((id) => (
                    <HolidaySection key={id} onDeleteClick={() => handleDeleteHolidaySection(id)} />
                ))}
                <div ref={scrollRef}></div>
            </div>
        </Dialog>
    </>
  );
};
 