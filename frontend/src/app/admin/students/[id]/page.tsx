"use client"
import StudentAttendance from '@/components/admin/students/StudentAttendance';
import StudentProfile from '@/components/admin/students/StudentProfile';
import StudentResults from '@/components/admin/students/StudentResults';
import TabBar from '@/components/common/TabBar';
// import { useParams } from 'next/navigation'
import React, { useState } from 'react'

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const ViewStudentPage = () => {
    // const {id} = useParams();

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
                <StudentProfile/>
            </div>
        )}
        { activeTabKey === "attendance" && (
            <div>
                <StudentAttendance/>
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