"use client";
import React, { useEffect, useState } from "react";
import { CustomSelectTag } from "../../common/CustomSelectTag";
import InputField from "@/components/InputField";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import { Calendar } from "@/@types";

interface SchoolConfigProps {
    calendars: Calendar[]
}

export const ConfigurationTabSection: React.FC<SchoolConfigProps> = ({calendars}) => {
    const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState('')
    const [calendarOptions, setCalendarOptions] = useState<{ value: string; label: string }[]>([]);
    const [selectedCalendarData, setSelectedCalendarData] = useState<typeof calendars[0] | null>(null);


    useEffect(() => {
        const options = calendars?.map((calendar) => ({
            value: calendar.id,
            label: calendar.name,
        }));

        setCalendarOptions(options);

        if (calendars.length > 0) {
            setSelectedAcademicCalendar(calendars[0].id);
            setSelectedCalendarData(calendars[0]);
        }
        
    }, [calendars]);

    const handleAcademicCalendarChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = event.target.value;
        setSelectedAcademicCalendar(selectedValue)
        const calendar = calendars.find(c => c.id === selectedValue);
        if (calendar) {
            setSelectedCalendarData(calendar);
        }
    };


  return (
    <div className="pb-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">Academic Calendar</h1>
        {calendars?.length > 0 && <CustomSelectTag options={calendarOptions} value={selectedAcademicCalendar} onOptionItemClick={handleAcademicCalendarChange} />}

        <div>
            <p className="text-xs text-[#878787] my-5">{selectedCalendarData?.name}</p>
            <h1 className="text-md font-semibold text-neutral-800 my-2">Terms</h1>

            { calendars?.length > 0  && (
            <div>
                {
                    selectedCalendarData?.terms?.map((term, index, arrayList) => (
                        <div key={index}>
                            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-4">
                                <InputField
                                    label="Team Name"
                                    isTransulent={true}
                                    value={term.termName}
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
                                    value={term.holidays?.length > 0 ? "Yes" : "No"}
                                    onChange={() => {}}
                                />
                                {
                                    term?.holidays?.map((holiday, hIndex) => (
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

                {selectedCalendarData?.terms?.length === 0 && (
                    <NoAvailableEmptyState message="No terms available yet." />
                )}
            </div>
            )}
            {calendars?.length === 0 && (
                <NoAvailableEmptyState message="No academic calendar available yet." />
            )}
        </div>
    </div>
  );
};
 