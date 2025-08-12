"use client"

import React, { useState } from 'react'
import StudentResults from '@/components/admin/students/StudentResults';
import { useGetCalendars, useGetMyResults, useStudentGetMe } from '@/hooks/student';

const StudentResultsView = () => {

  const [selectedResultYear, setSelectedResultYear] = useState("");

  const { studentCalendars } = useGetCalendars();
  const {me} = useStudentGetMe();

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
        studentData={me}
        onCalendarChange={(calendarId) => setSelectedResultYear(calendarId)} />
    </div>
  )
}

export default StudentResultsView;