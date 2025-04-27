import React from "react";
import InputField from "../InputField";
import Link from "next/link";
import ActionButton from "../ActionButton";
import { useRequestPasswordReset } from "@/hooks/auth";
import { toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

type FormData = z.infer<typeof emailSchema>;

interface ForgotPwdCardProps {
  user?: string;
}

const ForgotPasswordCard = ({ user }: ForgotPwdCardProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(emailSchema),
    mode: "onChange",
  });
  const [email] = watch(["email"]);
  const watchValue = watch();
  const validationResult = emailSchema.safeParse(watchValue);

  const { mutate, isPending } = useRequestPasswordReset(email);

  const router = useRouter();

  const requestPwdReset = () => {
      if (validationResult.success) {
        mutate(null as unknown as void, {
          onSuccess: (data) => {
            toast.success(data.data.message);
            if(user) {
              router.push(`/auth/${user}/forgotPassword/resetSuccess`);
            }
          },
          onError: (error) => {
            toast.error(error.message);
          },
        });
      } else {
        toast.error("Please enter a valid email");
      }
    
  };

  return (
    <section className="relative px-10 py-12 rounded-3xl border border-white border-solid bg-zinc-100 shadow-sm w-[475px] z-[1] max-md:max-w-[475px] max-md:w-[90%] max-sm:px-5 max-sm:py-8 max-sm:w-[95%]">
      <h1 className="mb-3.5 text-2xl font-bold text-neutral-800">
        Forgot {user ? "PIN" : "Password"}?
      </h1>
      <p className="mb-10 text-xs text-zinc-600">
        Enter {user ? "your email or ID" : "the email you used to sign up"}
      </p>
      <form method="POST" onSubmit={handleSubmit(requestPwdReset)}>
        <InputField
          label={user ? "Email or ID" : "Email"}
          {...register("email")}
          type="email"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
        <div className="relative mt-9 max-sm:mt-6">
          <ActionButton
            onClick={requestPwdReset}
            text={user ? "Request PIN Reset" : "Request Password Reset"}
            loading={isPending}
          />
        </div>
      </form>
      <p className="mt-11 text-xs text-center text-zinc-600">
        <Link href={user ? `/auth/${user}/login` : "/auth/login"}>
          <button className="font-semibold text-purple-500 cursor-pointer">
            Back to Sign In
          </button>
        </Link>
      </p>
    </section>
  );
};

export default ForgotPasswordCard;
