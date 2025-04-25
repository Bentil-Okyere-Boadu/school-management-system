import React, { useState } from 'react'
import InputField from '../InputField';
import Link from 'next/link';
import ActionButton from '../ActionButton';
import { useRequestPasswordReset } from '@/hooks/auth';
import { toast } from 'react-toastify';

const ForgotPasswordCard = () => {
    const [email, setEmail] = useState("");

    const { mutate, isPending } = useRequestPasswordReset(email)
  
    const requestPwdReset = () => {
      if(email) {
        mutate(null as unknown as void, {
          onSuccess: (data) => {
            toast.success(data.data.message);
          }, 
          onError: (error) => {
            toast.error(error.message);
          }
        })
      } else {
        toast.error('Please enter email')
      }
      // Handle sign in logic here
      //router.push('/auth/forgotPassword/resetRequest');
    };
  
    return (
      <section className="relative px-10 py-12 rounded-3xl border border-white border-solid bg-zinc-100 shadow-sm w-[475px] z-[1] max-md:max-w-[475px] max-md:w-[90%] max-sm:px-5 max-sm:py-8 max-sm:w-[95%]">
        <h1 className="mb-3.5 text-2xl font-bold text-neutral-800">Forgot Password?</h1>
        <p className="mb-10 text-xs text-zinc-600">
          Enter the email you used to sign up
        </p>
  
        <InputField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
  
        <div className="relative mt-9 max-sm:mt-6">
          <ActionButton onClick={requestPwdReset} text="Request Password Reset" loading={isPending} />
        </div>
  
        <p className="mt-11 text-xs text-center text-zinc-600">
          <Link href={"/auth/login"}>
            <button
              className="font-semibold text-purple-500 cursor-pointer"
            >
              Back to Sign In
            </button>
          </Link>
        </p>
      </section>
    );
}

export default ForgotPasswordCard