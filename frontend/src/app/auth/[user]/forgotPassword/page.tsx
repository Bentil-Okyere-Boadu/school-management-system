import AuthBg from '@/components/auth/AuthBg'
import ForgotPasswordCard from '@/components/auth/ForgotPasswordCard'
// import { useParams } from 'next/navigation'
import React from 'react';

export function generateStaticParams() {
  return [{ user: 'admin' }, { user: 'teacher' }, { user: 'student' }]
}

export const dynamicParams = false;

// eslint-disable-next-line @next/next/no-async-client-component
const ForgotPassword = async ({params} : { params: Promise<{user: string}> }) => {
  const { user } = await params;

  return (
    <AuthBg>
        <ForgotPasswordCard user={user as string}/>
    </AuthBg>
  )
}

export default ForgotPassword