"use client";
import React from "react";
import "../../global.css"
import AuthBg from "@/components/auth/AuthBg";
import SignUpCard from "@/components/auth/SignUpCard";

const SignUpPage: React.FC = () => {
  return (
    <AuthBg>
      <SignUpCard/>
    </AuthBg>
  );
};

export default SignUpPage;