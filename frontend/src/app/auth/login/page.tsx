"use client";
import React from "react";
import LoginCard from "../../../components/auth/LoginCard";
import AuthBg from "@/components/auth/AuthBg";

const LoginPage: React.FC = () => {
  return (
    <AuthBg>
      <LoginCard/>
    </AuthBg>
  );
};

export default LoginPage;