import React, { useState } from 'react'
import ActionButton from '../ActionButton';
import InputField from '../InputField';

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");

  const handleSignIn = () => {
    // Handle sign in logic here
    console.log("Signing in with:", password2);
  };

  return (
    <section className="relative px-10 py-12 rounded-3xl border border-white border-solid shadow-sm bg-zinc-100 w-[475px] z-[1] max-md:max-w-[475px] max-md:w-[90%] max-sm:px-5 max-sm:py-8 max-sm:w-[95%]">
      <h1 className="mb-3.5 text-2xl font-bold text-neutral-800">Reset Password?</h1>
      <p className="mb-10 text-xs text-zinc-600">
        Enter your new password below
      </p>

      <InputField
        label="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        isPasswordField={true}
      />

      <InputField
        label="Re-enter New Password"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        type="password"
        isPasswordField={true}
      />

      <div className="relative mt-9 max-sm:mt-6">
        <ActionButton onClick={handleSignIn} text="Save new password" />
      </div>

    </section>
  );
}

export default ResetPassword