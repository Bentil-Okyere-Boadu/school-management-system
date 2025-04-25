"use client"
import AuthBg from '@/components/auth/AuthBg'
import ResetPassword from '@/components/auth/ResetPassword'
import { useSearchParams } from 'next/navigation'
import React from 'react'

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthBg>
        <ResetPassword token={token as string}/>
    </AuthBg>
  )
}

export default ResetPasswordPage