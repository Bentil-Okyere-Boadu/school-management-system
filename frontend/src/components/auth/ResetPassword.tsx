import React, { useState } from 'react'
import ActionButton from '../ActionButton';
import InputField from '../InputField';
import { usePasswordReset } from '@/hooks/auth';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface ResetPwdProps {
  token: string
}

const ResetPassword: React.FC<ResetPwdProps> = ({token}) => {
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");

    const {mutate, isPending} = usePasswordReset({ token: token, password: password });
    const router = useRouter();

  const handlePwdReset = () => {
    // Handle sign in logic here
    if(password === password2) {
      mutate(null as unknown as void, {
        onSuccess: (data) => {
          toast.success(data.data.message);
          router.push("/auth/resetSuccess")
        },
        onError: (error) => {
          toast.error(error.response.data.message);
        }
      })
    }
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
        <ActionButton onClick={handlePwdReset} text="Save new password" loading={isPending} />
      </div>

    </section>
  );
}

export default ResetPassword