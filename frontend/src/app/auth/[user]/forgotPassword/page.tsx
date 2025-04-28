"use client"
import AuthBg from '@/components/auth/AuthBg'
import ForgotPasswordCard from '@/components/auth/ForgotPasswordCard'
import { useParams } from 'next/navigation'
import React from 'react'


const ForgotPassword = () => {
  const { user } = useParams();
  return (
    <AuthBg>
        <ForgotPasswordCard user={user}/>
    </AuthBg>
  )
}

export default ForgotPassword