"use client"
import { Student } from '@/@types';
import StudentProfile from '@/components/admin/students/StudentProfile'
import { useStudentGetMe } from '@/hooks/student';
import React from 'react'

const StudentDashboard = () => {

   const {me} = useStudentGetMe();

  return (
    <div>
      <StudentProfile studentData={me as Student} viewMode={false}/>
    </div>
  )
}

export default StudentDashboard