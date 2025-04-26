"use client"
import AuthBg from '@/components/auth/AuthBg'
import ForgotPasswordCard from '@/components/auth/ForgotPasswordCard'
import React from 'react'
import "../../global.css"


const ForgotPassword = () => {
  return (
    <AuthBg>
        <ForgotPasswordCard/>
    </AuthBg>
  )
}

export default ForgotPassword