'use client'
import AuthBg from '@/components/auth/AuthBg';
import CompleteRegistration from '@/components/auth/CompleteRegistration';
import { useSearchParams } from 'next/navigation';
import React from 'react'

const CompleteRegistrationPage = () => {
    const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthBg>
        <CompleteRegistration token={token as string}/>
    </AuthBg>
  )
  
}

export default CompleteRegistrationPage