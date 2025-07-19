"use client"
import ViewAttendance from '@/components/student/ViewAttendance'
import { useStudentGetMe } from '@/hooks/student'
import React from 'react'

const StudentDashboard = () => {
  const { me } = useStudentGetMe();

  return (
    <div>
      <ViewAttendance classLevelId={me?.classLevels[0].id}/>
    </div>
  )
}

export default StudentDashboard