"use client"
import { Calendar, Student, StudentAttendanceData } from '@/@types';
import StudentAttendance from '@/components/admin/students/StudentAttendance';
import StudentProfile from '@/components/admin/students/StudentProfile';
import StudentResults from '@/components/admin/students/StudentResults';
import TabBar from '@/components/common/TabBar';
import { useAdminViewStudentAttendance, useGetCalendars, useGetSchoolUserById } from '@/hooks/school-admin';
import { useParams } from 'next/navigation'
import React, { useState } from 'react'

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

    const {schoolUser, refetch} = useGetSchoolUserById(id as string)

    const [activeTabKey, setActiveTabKey] = useState('student-profile');
    
     const handleItemClick = (item: TabListItem) => {
        setActiveTabKey(item.tabKey);
      };

    const defaultNavItems: TabListItem[] = [
        { tabLabel: "Student Profile", tabKey: "student-profile" },
        { tabLabel: "Attendance", tabKey: "attendance" },
        { tabLabel: "Results", tabKey: "results" },
      ];
    const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

    const { studentAttendance } = useAdminViewStudentAttendance(
      (schoolUser as Student)?.classLevels?.[0]?.id,
      id as string,
      selectedAcademicYear
    ) as AttendanceData;
    const { calendars } = useGetCalendars();

    const handleSelectAcademicYear = (academicYearId: string) => {
      setSelectedAcademicYear(academicYearId);
    };

    const calendarsTestData = [
      {
        "id": "fe5f4449-acdf-4c0d-ba39-1cf50b1f24d6",
        "name": "2022/2023 Color Calendar1",
        "terms": [
          {
            "id": "1eef4266-4ccd-4914-8e95-2d040e95e304",
            "termName": "Second Term",
            "remarks": "Feyre has shown great improvement this term. With continued effort, even greater achievements await!",
            "entries": [
              {
                id: "41908827-86ce-4e5b-adca-9655ced97062",
                name: "hope",
                subject: "Mathematics",
                classScore: "18",
                examScore: "65",
                percentageScore: "83",
                grade: "A", 
              },
              {
                id: "64649300-c9ca-41f7-9596-4d8bce44928f",
                name: "joke",
                subject: "English",
                classScore: "20",
                examScore: "45",
                percentageScore: "65", 
                grade: "B", 
              }
            ]
          },
          {
            "id": "4e9349cc-4940-4535-85f8-691254b02533",
            "termName": "Third Term",
            "remarks": "Good performance",
            "entries": [
              {
                id: "141908827-86ce-4e5b-adca-9655ced97062",
                name: "hope",
                subject: "Mathematics",
                classScore: "18",
                examScore: "65",
                percentageScore: "83", 
                grade: "A", 
              },
              {
                id: "164649300-c9ca-41f7-9596-4d8bce44928f",
                name: "joke",
                subject: "English",
                classScore: "20",
                examScore: "45",
                percentageScore: "65",
                grade: "B",
              }
            ]
          }
        ]
      },
      {
        "id": "5b36e7e5-0414-4e63-8928-48ed0860206b",
        "name": "2023/2024 New Calendar",
        "terms": [
          {
            "id": "5e09f278-d7f9-4063-8ead-e68a3c1983c0",
            "termName": "gh",
            "remarks": "Good performance",
            "entries": [
              {
                id: "141908827-86ce-4e5b-adca-9655ced97062",
                name: "hope",
                subject: "Mathematics",
                classScore: "18",
                examScore: "65",
                percentageScore: "83",
                grade: "A", 
              },
              {
                id: "164649300-c9ca-41f7-9596-4d8bce44928f",
                name: "joke",
                subject: "English",
                classScore: "20",
                examScore: "45",
                percentageScore: "65",
                grade: "B",
              }
            ]
          }
        ]
      },
    ];

  return (
    <div className='px-0.5'>
        <TabBar 
          items={defaultNavItems} 
          activeTabKey={activeTabKey} 
          onItemClick={handleItemClick} // triggered from the child, it will in return trigger handleItemClick function
        />

        { activeTabKey === "student-profile" && (
            <div>
                <StudentProfile viewMode={true} studentData={schoolUser as Student} refetch={refetch}/>
            </div>
        )}
        { activeTabKey === "attendance" && (
            <div>
              <StudentAttendance 
                studentAttendance={studentAttendance}
                calendars={calendars}
                onSelectAcademicYear={handleSelectAcademicYear}
              />
            </div>
        )}
        { activeTabKey === "results" && (
            <div>
                <StudentResults 
                  calendars={calendarsTestData as Calendar[]}
                  showExportButton={false} />
            </div>
        )}
    </div>
  )
}


export default ViewStudentPage