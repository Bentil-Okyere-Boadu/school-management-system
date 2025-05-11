'use client'
import AuthBg from '@/components/auth/AuthBg';
import CompleteRegistration from '@/components/auth/CompleteRegistration';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react'

const CompleteRegistrationPage = () => {
    const searchParams = useSearchParams();
  const token = searchParams.get('token') || "";

  return (
    <Suspense>
      <AuthBg>
          <CompleteRegistration token={token as string}/>
      </AuthBg>
    </Suspense>
  )
  
}

export default CompleteRegistrationPage