import AuthBg from '@/components/auth/AuthBg'
import LoginCard from '@/components/auth/LoginCard'
import React from 'react'

export function generateStaticParams() {
  return [{ user: 'admin' }, { user: 'teacher' }, { user: 'student' }]
}

export const dynamicParams = false;

const UserLogin = () => {
  return (
    <AuthBg>
        <LoginCard/>
    </AuthBg>
  )
}

export default UserLogin