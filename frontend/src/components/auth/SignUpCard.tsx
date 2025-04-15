"use client";
import React, { useState } from "react";
import InputField from "../InputField";
import ActionButton from "../ActionButton";
import Link from "next/link";

const SignUpCard: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = () => {
    // Handle sign up logic here
    console.log("Sign up clicked");
  };

  return (
    <section className="relative px-10 py-12 rounded-3xl border border-white border-solid shadow-sm bg-zinc-100 w-[475px] z-[1] max-md:max-w-[475px] max-md:w-[90%] max-sm:px-5 max-sm:py-8 max-sm:w-[95%]">
      <h1 className="mb-3.5 text-2xl font-bold text-neutral-800">Sign up</h1>
      <p className="mb-10 text-xs text-zinc-600">
        Register your account
      </p>

      <InputField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />

      <InputField
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        isPasswordField={true}
      />
      
      <InputField
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        type="password"
        isPasswordField={true}
      />

      <div className="relative mt-9 max-sm:mt-6">
        <ActionButton onClick={handleSignUp} text="Sign Up" />
      </div>

      <p className="mt-11 text-xs text-center text-zinc-600">
        Already have an account?{" "}
        <Link href={"/auth/signup"}>
            <button
            className="font-semibold text-purple-500 cursor-pointer"
            >
            Sign in
            </button>
        </Link>
      </p>
    </section>
  );
};

export default SignUpCard;
