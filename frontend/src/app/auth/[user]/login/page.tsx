'use client'
import AuthBg from '@/components/auth/AuthBg'
import LoginCard from '@/components/auth/LoginCard'
import { useParams } from 'next/navigation'
import React from 'react'

const UserLogin = () => {
    const { user } = useParams()
  return (
    <AuthBg>
        <LoginCard user={user}/>
    </AuthBg>
  )
}

export default UserLogin