"use client"
import { Student } from '@/@types';
import StudentProfile from '@/components/admin/students/StudentProfile'
import { useStudentGetMe } from '@/hooks/student';
import React from 'react'

const StudentDashboard = () => {

   const {me, refetch} = useStudentGetMe();

  return (
    <div>
      <StudentProfile studentData={me as Student} viewMode={false} refetch={refetch}/>
    </div>
  )
}

export default StudentDashboard