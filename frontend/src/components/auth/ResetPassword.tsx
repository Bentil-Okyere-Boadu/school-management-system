import React from 'react'
import ActionButton from '../ActionButton';
import InputField from '../InputField';
import { usePasswordReset } from '@/hooks/auth';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ButtonType } from '@/@types';

interface ResetPwdProps {
  token: string
}

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must include at least 1 uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must include at least 1 lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must include at least 1 number" })
    .regex(/[!@#$%^&*]/, {
      message: "Password must include at least 1 special character (!@#$%^&*)",
    }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"] 
});

type FormData = z.infer<typeof passwordSchema>;

const ResetPassword: React.FC<ResetPwdProps> = ({token}) => {

    const {
        register,
        handleSubmit,
        formState: {},
        watch
      } = useForm<FormData>({
        resolver: zodResolver(passwordSchema),
        mode: 'onChange'
      });

      const [ password, confirmPassword] = watch(['password', 'confirmPassword']);


      const watchValues = watch();
      const validationResult = passwordSchema.safeParse(watchValues);

      const passwordChecks = {
        minLength: password?.length >= 8,
        hasUpperCase: /[A-Z]/.test(password || ''),
        hasLowerCase: /[a-z]/.test(password || ''),
        hasNumber: /[0-9]/.test(password || ''),
        hasSpecialChar: /[!@#$%^&*]/.test(password || ''),
        matchesConfirm: password === confirmPassword && confirmPassword !== ''
      };

    const {mutate, isPending} = usePasswordReset({ token: token, password: password });
    const router = useRouter();

  const handlePwdReset = () => {
    // Handle sign in logic here
    if(validationResult.success) {
      mutate(null as unknown as void, {
        onSuccess: (data) => {
          toast.success(data.data.message);
          router.push("/auth/forgotPassword/resetSuccess")
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
      <form onSubmit={handleSubmit(handlePwdReset)} method='POST'>
      <InputField
        label="New Password"
        type="password"
        isPasswordField={true}
        {...register("password")}
      />
        { password && (<div className="text-sm text-gray-600 mb-4">
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li className={passwordChecks.minLength ? 'text-green-600' : 'text-red-600'}>
              {!passwordChecks.minLength ? '✗' : '✓'} At least 8 characters long
            </li>
            <li className={passwordChecks.hasUpperCase ? 'text-green-600' : 'text-red-600'}>
              {!passwordChecks.hasUpperCase ? '✗' : '✓'} 1 uppercase letter (A-Z)
            </li>
            <li className={passwordChecks.hasLowerCase ? 'text-green-600' : 'text-red-600'}>
              {!passwordChecks.hasLowerCase ? '✗' : '✓'} 1 lowercase letter (a-z)
            </li>
            <li className={passwordChecks.hasNumber ? 'text-green-600' : 'text-red-600'}>
              {!passwordChecks.hasNumber ? '✗' : '✓'} 1 number (0-9)
            </li>
            <li className={passwordChecks.hasSpecialChar ? 'text-green-600' : 'text-red-600'}>
              {!passwordChecks.hasSpecialChar ? '✗' : '✓'} 1 special character (!@#$%^&*)
            </li>
            <li className={passwordChecks.matchesConfirm ? 'text-green-600' : 'text-red-600'}>
              {!passwordChecks.matchesConfirm ? '✗' : '✓'} Passwords must match
            </li>
          </ul>
        </div>)}

      <InputField
        label="Re-enter New Password"
        type="password"
        isPasswordField={true}
        {...register("confirmPassword")}
      />

      <div className="relative mt-9 max-sm:mt-6">
        <ActionButton type={ButtonType.submit} text="Save new password" loading={isPending} />
      </div>
      </form>
    </section>
  );
}

export default ResetPassword