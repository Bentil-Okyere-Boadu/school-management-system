"use client"
import { Student } from '@/@types';
import StudentAttendance from '@/components/admin/students/StudentAttendance';
import StudentProfile from '@/components/admin/students/StudentProfile';
import StudentResults from '@/components/admin/students/StudentResults';
import TabBar from '@/components/common/TabBar';
import { useGetSchoolUserById } from '@/hooks/school-admin';
import { useParams } from 'next/navigation'
import React, { useState } from 'react'

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

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
                <StudentAttendance classLevelId={(schoolUser as Student).classLevels[0].id}/>
            </div>
        )}
        { activeTabKey === "results" && (
            <div>
                <StudentResults/>
            </div>
        )}
    </div>
  )
}


export default ViewStudentPage