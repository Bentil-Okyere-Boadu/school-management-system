"use client"
import React from "react";
import { useRouter } from "next/navigation";
import CustomButton from "../Button";

interface ResetEmailProps {
    firstName: string,
    id?: string
}

const ResetReqEmailContent = ({firstName}: ResetEmailProps) => {
    const router = useRouter();
    const changePasswordClick = () => {
        router.push('/auth/forgotPassword/resetPassword');
    }

    return (
      <article className="flex flex-col gap-5 mx-auto my-0 max-w-[459px] max-md:gap-5">
        <header className="text-2xl font-medium leading-8 text-neutral-800 max-sm:text-xl">
          Password Reset Request
        </header>
  
        <section className="text-base tracking-normal leading-6 text-neutral-500 max-sm:text-sm">
          <p>Hi {firstName},</p>
          <br />
          <p>
            We received a request to reset your password for your SMS account.
            Simply click the button below to set up a new password:
          </p>
        </section>
  
        <CustomButton text='Change Password' onClick={changePasswordClick}/>
  
        <section className="text-base tracking-normal leading-6 text-neutral-500 max-sm:text-sm">
          <p>
            This link is valid for the next 24 hours. If you didn&apos;t request this,
            please ignore this email, and your password will remain unchanged.
          </p>
          <br />
          <p>Best,</p>
          <p>SMS Team</p>
        </section>
      </article>
    );
}

export default ResetReqEmailContent