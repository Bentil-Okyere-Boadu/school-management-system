"use client"
import { Student } from '@/@types';
import StudentAttendance from '@/components/admin/students/StudentAttendance';
import StudentProfile from '@/components/admin/students/StudentProfile';
import TabBar from '@/components/common/TabBar';
import { useParams } from 'next/navigation'
import React, { useState } from 'react'
import { useGetStudentById } from '@/hooks/teacher';

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

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
                <StudentAttendance classLevelId={(studentData as Student).classLevels[0].id} />
            </div>
        )}
    </div>
  )
}


export default ViewStudentPage