"use client";
import React, { useEffect, useRef, useState } from "react";
import { CustomSelectTag } from "../../common/CustomSelectTag";
import InputField from "@/components/InputField";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import CustomUnderlinedButton from "../../common/CustomUnderlinedButton";
import { Dialog } from "@/components/common/Dialog";
import { Select } from "@mantine/core";
import CustomButton from "@/components/Button";
import { HolidaySection } from "./HolidaySection";
import { toast } from "react-toastify";
import { useCreateCalendar, useDeleteCalendar, useEditCalendar, useGetCalendars, useCreateTerm, useDeleteTerm, useEditTerm } from "@/hooks/school-admin";
import { Calendar, Term, Holiday, ErrorResponse } from "@/@types";


export const ConfigurationTabSection: React.FC = () => {
    const [selectedAcademicCalendar, setSelectedAcademicCalendar] = useState('');
    const [isAcademicCalendarOpen, setIsAcademicCalendarOpen] = useState(false);
    const [selectedHolidaysInTerms, setSelectedHolidaysInTerms] = useState<string | null>('No');
    const scrollRef = useRef<HTMLDivElement>(null);

    const [calendarName, setCalendarName] = useState('');
    const [editCalendarMode, setEditCalendarMode] = useState(false);
    const [calendarId, setCalendarId] = useState('');
    const [selectedCalendarData, setSelectedCalendarData] = useState<typeof calendars[0] | null>(null);
    const [isConfirmDeleteCalendarDialogOpen, setIsConfirmDeleteCalendarDialogOpen] = useState(false);

    const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
    const [termName, setTermName] = useState('');
    const [termStartDate, setTermStartDate] = useState('');
    const [termEndDate, setTermEndDate] = useState('');
    const [termId, setTermId] = useState('');
    const [editTermMode, setEditTermMode] = useState(false);
    // const [selectedTermData, setSelectedTermData] = useState<Term | null>(null);
    const [isConfirmDeleteTermDialogOpen, setIsConfirmDeleteTermDialogOpen] = useState(false);
    const [calendarOptions, setCalendarOptions] = useState<{ value: string; label: string }[]>([]);
    const holidaysInTermOptions = ['Yes', 'No'];
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [isUseFirstCalendar, setIsUseFirstCalendar] = useState(true);

    const { calendars, refetch: refetchCalendars } = useGetCalendars();
    const { mutate: editCalendarMutation, isPending: pendingCalendarEdit } = useEditCalendar(calendarId);
    const { mutate: deleteCalendarMutation, isPending: pendingCalendarDelete } = useDeleteCalendar();
    const { mutate: createCalendarMutation, isPending: pendingCalendarCreate } = useCreateCalendar();

    const { mutate: editTermMutation, isPending: pendingTermEdit } = useEditTerm(termId);
    const { mutate: deleteTermMutation, isPending: pendingTermDelete } = useDeleteTerm();
    const { mutate: createTermMutation, isPending: pendingTermCreate } = useCreateTerm();


    useEffect(() => {
        const options = calendars?.map((calendar) => ({
            value: calendar.id,
            label: calendar.name,
        }));

        setCalendarOptions(options);

        if ((calendars.length > 0 && isUseFirstCalendar) || calendars.length === 1) {
            setSelectedAcademicCalendar(calendars[0].id);
            setSelectedCalendarData(calendars[0]);
        } else if (!isUseFirstCalendar) {
            const foundCalendar: Calendar | undefined = calendars.find(c => c.id === selectedAcademicCalendar);
            if (foundCalendar) {
                setSelectedAcademicCalendar(foundCalendar.id);
                setSelectedCalendarData(foundCalendar);
            }
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

    const handleHolidaysInTermChange = (value: string | null) => {
        setSelectedHolidaysInTerms(value);
        if (value === "No") {
            setHolidays([]);
        }
    }

    const handleHolidayChange = (index: number, updatedHoliday: Holiday) => {
        setHolidays((prev) => {
            const copy = [...prev];
            copy[index] = updatedHoliday;
            return copy;
        });
    };

    const handleAddHolidaySection = () => {
        setHolidays((prev) => [...prev, { name: '', date: '' }] as Holiday[]);

        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleDeleteHoliday = (index: number) => {
        setHolidays((prev) => prev.filter((_, i) => i !== index));
    };

    const onEditCalendarClick = (data: Partial<Calendar>) => {
        setEditCalendarMode(true);
        setCalendarId(data.id as string);
        setIsAcademicCalendarOpen(true);
        setCalendarName(data.name as string);
    }

    const editCalendar = () => {
        editCalendarMutation({ name: calendarName }, {
            onSuccess: () => {
                toast.success('Successfully updated calendar.')
                setIsAcademicCalendarOpen(false);
                setIsUseFirstCalendar(false);
                refetchCalendars();
            },
            onError: (error: unknown) => {
                toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
            }
        })
    }

    const createCalendar = () => {
        createCalendarMutation({ name: calendarName}, {
            onSuccess: () => {
                toast.success('Successfully created calendar.')
                setIsAcademicCalendarOpen(false);
                setIsUseFirstCalendar(false);
                refetchCalendars();
            },
            onError: (error: unknown) => {
                toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
            }
        })
    };

    const deleteCalendar = () => {
        deleteCalendarMutation(calendarId, {
            onSuccess: () => {
                toast.success('Deleted successfully.');
                setIsConfirmDeleteCalendarDialogOpen(false);
                setIsUseFirstCalendar(true);
                refetchCalendars();
            },
            onError: (error: unknown) => {
                toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
            }
        })
    }
    
    const onDeleteCalendarClick = (sId: string) => {
        setIsConfirmDeleteCalendarDialogOpen(true);
        setCalendarId(sId);
    }

    const onAddNewCalendar = () => {
        setIsAcademicCalendarOpen(true);
        setEditCalendarMode(false);
        setCalendarName('');
        setCalendarId('');
    }


    const onEditTermClick = (data: Partial<Term>) => {
        setEditTermMode(true);
        setTermId(data.id as string);
        setIsTermDialogOpen(true);
        setTermName(data.termName as string);
        setTermStartDate(data.startDate as string);
        setTermEndDate(data.endDate as string);
        setSelectedHolidaysInTerms((data?.holidays && data.holidays.length > 0) ? "Yes" : "No");
        const updatedHolidays = data?.holidays?.map((holiday) => ({
            name: holiday.name,
            date: holiday.date,
        })) as Holiday[];
        setHolidays(updatedHolidays);
    }

    const editTerm = () => {
        editTermMutation({ termName: termName, startDate: termStartDate, endDate: termEndDate, holidays: holidays }, {
            onSuccess: () => {
                toast.success('Successfully updated term.')
                setIsTermDialogOpen(false);
                setIsUseFirstCalendar(false); // ensure the select option doesn't result to the initial value
                refetchCalendars();
            },
            onError: (error: unknown) => {
                toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
            }
        })
    }

    const createTerm = () => {
        createTermMutation({ termName: termName, startDate: termStartDate, endDate: termEndDate, academicCalendarId: selectedCalendarData?.id, holidays: holidays }, {
            onSuccess: () => {
                toast.success('Successfully created term.')
                setIsTermDialogOpen(false);
                setIsUseFirstCalendar(false);
                refetchCalendars();
            },
            onError: (error: unknown) => {
                toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
            }
        })
    };

    const deleteTerm = () => {
        deleteTermMutation(termId, {
            onSuccess: () => {
                toast.success('Deleted successfully.');
                setIsConfirmDeleteTermDialogOpen(false);
                setIsUseFirstCalendar(false);
                refetchCalendars();
            },
            onError: (error: unknown) => {
                toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
            }
        })
    }
    
    const onDeleteTermButtonClick = (sId: string) => {
        setIsConfirmDeleteTermDialogOpen(true);
        setTermId(sId);
    }

    const onAddNewTerm = () => {
        setIsTermDialogOpen(true);
        setEditTermMode(false);
        setTermName('');
        setTermStartDate('');
        setTermEndDate('');
        setHolidays([]);
        setTermId('');
        setSelectedHolidaysInTerms('No')
    }

  return (
    <>
        <div className="pb-8">
            <h1 className="text-md font-semibold text-neutral-800 mb-2">Academic Calendar</h1>
            <div className="flex items-center justify-between">
                {calendars?.length > 0 ? <CustomSelectTag options={calendarOptions} value={selectedAcademicCalendar} onOptionItemClick={handleAcademicCalendarChange} /> : <div></div>}
                <CustomButton variant="outline" className="!py-1" text="Create Calendar" onClick={() => onAddNewCalendar()} />
            </div>

            { calendars?.length > 0  && (
            <div>
                <div className="flex gap-2">
                    <p className="text-md text-[#878787] my-5">{selectedCalendarData?.name}</p>
                    <CustomUnderlinedButton
                        text="Edit"
                        textColor="text-purple-500"
                        onClick={() => {onEditCalendarClick(selectedCalendarData as Calendar)}}
                        showIcon={false}
                    />
                    <CustomUnderlinedButton
                        text="Delete"
                        textColor="text-purple-500"
                        onClick={() => { onDeleteCalendarClick(selectedCalendarData?.id as string)}}
                        showIcon={false}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <h1 className="text-md font-semibold text-neutral-800">
                        Terms
                    </h1>
                    <CustomUnderlinedButton
                        text="Add New"
                        textColor="text-purple-500"
                        onClick={() => { onAddNewTerm() }}
                        showIcon={false}
                    />
                </div>
                {
                    selectedCalendarData?.terms?.map((term, index, arrayList) => (
                        <div key={index}>
                            <div className="flex justify-end gap-3">
                                <CustomUnderlinedButton
                                    text="Edit"
                                    textColor="text-gray-500"
                                    onClick={() => {onEditTermClick(term)}}
                                    showIcon={false}
                                />
                                <CustomUnderlinedButton
                                    text="Delete"
                                    textColor="text-gray-500"
                                    onClick={()=>{onDeleteTermButtonClick(term.id)}}
                                    showIcon={false}
                                />
                            </div>

                            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2">
                                <InputField
                                    label="Team Name"
                                    isTransulent={false}
                                    value={term.termName}
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
                                    value={term.holidays?.length > 0 ? "Yes" : "No"}
                                    onChange={() => {}}
                                />
                                {
                                    term.holidays?.map((holiday, hIndex) => (
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

                {selectedCalendarData?.terms?.length === 0 && (
                    <NoAvailableEmptyState message="No terms available yet." />
                )}
            </div>
            )}
            {calendars?.length === 0 && (
                <NoAvailableEmptyState message="No academic calendar available yet." />
            )}
        </div>

        {/* Add New Term Dialog */}
        <Dialog
            isOpen={isTermDialogOpen}
            dialogTitle={`${editTermMode ? 'Edit' : 'Add New'} Term`}
            saveButtonText="Save Term"
            onClose={() => {setIsTermDialogOpen(false)}}
            onSave={editTermMode ? editTerm : createTerm}
            busy={editTermMode? pendingTermEdit : pendingTermCreate}
        >
            <p className="text-xs text-gray-500">
                Enter the details for the academic year
            </p>
            <div className="my-3 flex flex-col gap-4">
                <InputField
                    className="!py-0"
                    placeholder="Enter Title"
                    label="Term Name"
                    value={termName}
                    onChange={(e) => {setTermName(e.target.value)}}
                    isTransulent={false}
                />
                <InputField
                    className="!py-0"
                    placeholder="Enter Date"
                    label="Start Date"
                    value={termStartDate}
                    type="date"
                    onChange={(e) => {setTermStartDate(e.target.value)}}
                    isTransulent={false}
                />
                <InputField
                    className="!py-0"
                    placeholder="Enter Date"
                    label="End Date"
                    value={termEndDate}
                    type="date"
                    onChange={(e) => {setTermEndDate(e.target.value)}}
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
                        <CustomButton variant="outline" className="!py-1" text="Add Holiday" onClick={handleAddHolidaySection} />
                }

                {holidays?.map((holiday, index) => (
                    <HolidaySection
                        key={index}
                        index={index}
                        name={holiday.name}
                        date={holiday.date}
                        onChange={(updatedHoliday) => handleHolidayChange(index, updatedHoliday)}
                        onDeleteClick={() => handleDeleteHoliday(index)}
                    />
                ))}

                <div ref={scrollRef}></div>
            </div>
        </Dialog>

        {/* Confirm Delete New Term Dialog */}
        <Dialog 
            isOpen={isConfirmDeleteTermDialogOpen}
            busy={pendingTermDelete}
            dialogTitle="Confirm Delete"
            saveButtonText="Delete Term"
            onClose={() => { setIsConfirmDeleteTermDialogOpen(false)}} 
            onSave={deleteTerm}
        >
            <div className="my-3 flex flex-col gap-4">
                <p>
                    Are you sure you want to delete this term? You will loose all related information
                </p>
            </div>
        </Dialog>

        {/* Add New Academic Calendar Dialog */}
        <Dialog
            isOpen={isAcademicCalendarOpen}
            dialogTitle={`${editCalendarMode ? 'Edit' : 'Add New'} Academic Calendar`}
            saveButtonText="Save Calendar"
            onClose={() => {setIsAcademicCalendarOpen(false)}}
            onSave={editCalendarMode ? editCalendar : createCalendar}
            busy={editCalendarMode? pendingCalendarEdit : pendingCalendarCreate}
        >
            <div className="my-3 flex flex-col gap-4">
                <InputField
                    className="!py-0"
                    placeholder="Enter name"
                    label="Academic Calendar Name"
                    value={calendarName}
                    onChange={(e) => {setCalendarName(e.target.value)}}
                    isTransulent={false}
                />
            </div>
        </Dialog>

        {/* Confirm Delete Academic Calendar Dialog */}
        <Dialog 
            isOpen={isConfirmDeleteCalendarDialogOpen}
            busy={pendingCalendarDelete}
            dialogTitle="Confirm Delete"
            saveButtonText="Delete Calendar"
            onClose={() => { setIsConfirmDeleteCalendarDialogOpen(false)}} 
            onSave={deleteCalendar}
        >
            <div className="my-3 flex flex-col gap-4">
                <p>
                    Are you sure you want to delete this calendar? You will loose all related information
                </p>
            </div>
        </Dialog>
    </>
  );
};
 