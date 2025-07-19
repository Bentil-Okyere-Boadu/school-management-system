"use client"

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Student, StudentAttendanceData } from '@/@types';
import StudentAttendance from '@/components/admin/students/StudentAttendance';
import StudentProfile from '@/components/admin/students/StudentProfile';
import TabBar from '@/components/common/TabBar';
import { useGetStudentById, useAdminViewStudentAttendance, useGetCalendars,  } from '@/hooks/teacher';

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

interface AttendanceData {
  studentAttendance: StudentAttendanceData;
  isLoading: boolean;
  refetch: () => void
}

const ViewStudentPage = () => {
    const {id} = useParams();

    const {studentData, refetch} = useGetStudentById(id as string)

    const [activeTabKey, setActiveTabKey] = useState('student-profile');
    
    const handleItemClick = (item: TabListItem) => {
        setActiveTabKey(item.tabKey);
    };

    const defaultNavItems: TabListItem[] = [
        { tabLabel: "Student Profile", tabKey: "student-profile" },
        { tabLabel: "Attendance", tabKey: "attendance" },
    ];

    const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

    const { studentAttendance } = useAdminViewStudentAttendance(
      (studentData as Student)?.classLevels?.[0]?.id,
      id as string,
      selectedAcademicYear
    ) as AttendanceData;
    const { studentCalendars } = useGetCalendars();

    const handleSelectAcademicYear = (academicYearId: string) => {
      setSelectedAcademicYear(academicYearId);
    };

  return (
    <div className='px-0.5'>
        <TabBar 
          items={defaultNavItems} 
          activeTabKey={activeTabKey} 
          onItemClick={handleItemClick} // triggered from the child, it will in return trigger handleItemClick function
        />

        { activeTabKey === "student-profile" && (
            <div>
                <StudentProfile viewMode={true} studentData={studentData as Student} refetch={refetch}/>
            </div>
        )}
        { activeTabKey === "attendance" && (
            <div>
                <StudentAttendance  
                studentAttendance={studentAttendance}
                calendars={studentCalendars}
                onSelectAcademicYear={handleSelectAcademicYear}
                />
            </div>
        )}
    </div>
  )
}


export default ViewStudentPage