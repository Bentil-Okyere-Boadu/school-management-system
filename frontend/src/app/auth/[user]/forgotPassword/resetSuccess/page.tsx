'use client'
import AuthBg from '@/components/auth/AuthBg'
import DoneRafiki from '@/images/Done-rafiki (1) 1.png'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { useParams } from 'next/navigation'


const ResetSuccess = () => {
  const { user } = useParams();
  return (
    <AuthBg>
        <section className='text-center'>
            <Image src={DoneRafiki} alt='Done rafiki' width={300} height={300} className='m-[auto]' priority={true}></Image>
            <h1 className='my-2 font-bold'>{user  && user !== 'admin'? 'PIN':'Password'} Reset Successful</h1>
            {user  && user !== 'admin'? (
              <p>
                Your PIN has been successfully reset.<br/>
                The new PIN has been sent to your registered email.<br/>
                <Link href={`/auth/${user}/login`}><button
              className="font-semibold text-purple-500 cursor-pointer underline"
            >
              Log in
            </button></Link>
              </p>
            ) : (
            <p>
                Your password has been successfully reset!<br/>
                You can now <Link href={user? `/auth/${user}/login` : `/auth/login`}><button
              className="font-semibold text-purple-500 cursor-pointer underline"
            >
              log in
            </button></Link> using your new password.<br/> 
                If you did not request this change, please contact support immediately.
            </p>
          )}
        </section>
    </AuthBg>
  )
}

export default ResetSuccess