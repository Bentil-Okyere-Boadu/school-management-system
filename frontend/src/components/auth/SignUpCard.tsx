"use client";
import React from "react";
import InputField from "../InputField";
import ActionButton from "../ActionButton";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ButtonType } from "@/@types";
import { useAdminSignUp } from "@/hooks/auth";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// Define the password schema with Zod
const signUpSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
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
  path: ["confirmPassword"] // path of error
});

// Infer the form type from the schema
type FormData = z.infer<typeof signUpSchema>;

const SignUpCard: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange'
  });

  // Watch fields for real-time validation
  const [email, password, confirmPassword] = watch(['email', 'password', 'confirmPassword']);

  const watchedValues = watch();

  const validationResult = signUpSchema.safeParse(watchedValues);
  const router = useRouter()
  
  const passwordChecks = {
    minLength: password?.length >= 8,
    hasUpperCase: /[A-Z]/.test(password || ''),
    hasLowerCase: /[a-z]/.test(password || ''),
    hasNumber: /[0-9]/.test(password || ''),
    hasSpecialChar: /[!@#$%^&*]/.test(password || ''),
    matchesConfirm: password === confirmPassword && confirmPassword !== ''
  };

  // Helper function to check which validations are failing
  const getPasswordErrors = () => {
    if (!errors.password) return {};
    
    return {
      minLength: errors.password.message?.includes('at least 8 characters'),
      uppercase: errors.password.message?.includes('uppercase'),
      lowercase: errors.password.message?.includes('lowercase'),
      number: errors.password.message?.includes('number'),
      specialChar: errors.password.message?.includes('special character')
    };
  };

  const passwordErrors = getPasswordErrors();
  const { mutate, isPending } = useAdminSignUp()

  const handleSignUp = (data: FormData) => {
    // Handle sign up logic here
    if(validationResult.success) {
      mutate({name: "Koo Admin", email: data.email, password: data.password, role:"super_admin"}, {
        onSuccess: () => {
          toast.success("Sign up successful");
          router.push('/admin/dashboard');
        }, 
        onError: (error: AxiosError) => {
          toast.error(error.response?.data.message);
        }
      })
    } else {
      toast.error("Please fill all required fields with the right values.")
    }
  };

  return (
    <section className="relative px-10 py-12 rounded-3xl border border-white border-solid shadow-sm bg-zinc-100 w-[475px] z-[1] max-md:max-w-[475px] max-md:w-[90%] max-sm:px-5 max-sm:py-8 max-sm:w-[95%]">
      <h1 className="mb-3.5 text-2xl font-bold text-neutral-800">Sign up</h1>
      <p className="mb-10 text-xs text-zinc-600">Register your account</p>
      <form onSubmit={handleSubmit(handleSignUp)} method="POST">
        <InputField
          label="Email"
          type="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}

        <InputField
          label="Password"
          type="password"
          isPasswordField={true}
          {...register("password")}
        />

        {errors.password && (
          <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
        )}

        { password && (<div className="text-sm text-gray-600 mb-4">
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li className={passwordChecks.minLength ? 'text-green-600' : 'text-red-600'}>
              {passwordErrors.minLength ? '✗' : '✓'} At least 8 characters long
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
          label="Confirm Password"
          type="password"
          isPasswordField={true}
          {...register("confirmPassword")}
        />
        
        <div className={`relative mt-9 max-sm:mt-6 ${
          Object.values(passwordChecks).every(Boolean) && email
            ? 'opacity-100'
            : 'opacity-70 cursor-not-allowed'
        }`}>
          <ActionButton
            type={ButtonType.submit}
            text="Sign Up"
            loading={isPending}
            disabled={!Object.values(passwordChecks).every(Boolean) || !email}
          />
        </div>

      </form>

      <p className="mt-11 text-xs text-center text-zinc-600">
        Already have an account?{" "}
        <Link href={"/auth/login"}>
          <button className="font-semibold text-purple-500 cursor-pointer">
            Sign in
          </button>
        </Link>
      </p>
    </section>
  );
};

export default SignUpCard;
