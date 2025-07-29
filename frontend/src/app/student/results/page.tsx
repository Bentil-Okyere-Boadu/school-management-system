"use client"
import React, { useState } from 'react'
import { StudentResultsResponse } from '@/@types';
import StudentResults from '@/components/admin/students/StudentResults';
import { useGetCalendars, useGetMyResults } from '@/hooks/student';

const StudentResultsView = () => {

  const [selectedResultYear, setSelectedResultYear] = useState("");

  const { studentCalendars } = useGetCalendars();

  
  const onExportButtonClick = (item: StudentResultsResponse) => {
    console.log("Exporting report for:", item);
  };

  const { resultsData: studentResults } = useGetMyResults(selectedResultYear, {
    enabled: !!selectedResultYear,
    queryKey: ['myResult', selectedResultYear]
  });
      
  return (
    <div>
      <StudentResults 
        calendars={studentCalendars}
        studentResults={studentResults}
        showExportButton={true}
        onExportButtonClick={onExportButtonClick}
        onCalendarChange={(calendarId) => setSelectedResultYear(calendarId)} />
    </div>
  )
}

export default StudentResultsView;