import AuthBg from '@/components/auth/AuthBg'
import DoneRafiki from '@/images/Done-rafiki (1) 1.png'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'


const ResetSuccess = () => {
  return (
    <AuthBg>
        <section className='text-center'>
            <Image src={DoneRafiki} alt='Done rafiki' width={300} height={300} className='m-[auto]' priority={true}></Image>
            <h1 className='my-2 font-bold'>Password Reset Successful</h1>
            <p>
                Your password has been successfully reset!<br/>
                You can now <Link href={"/auth/login"}><button
              className="font-semibold text-purple-500 cursor-pointer underline"
            >
              log in
            </button></Link> using your new password.<br/> 
                If you did not request this change, please contact support immediately.
            </p>
        </section>
    </AuthBg>
  )
}

export default ResetSuccess