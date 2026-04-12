"use client"
import React, { useCallback, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import InputField from "../InputField";
import Link from "next/link";
import ActionButton from "../ActionButton";
import { toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { usePathname, useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { customAPI } from "../../../config/setup";
import type { ForgotPasswordBody } from "@/hooks/auth";
import { ButtonType } from "@/@types";

type FormData = {
  identifier: string;
};

interface ForgotPwdCardProps {
  user?: string;
}

const ForgotPasswordCard = ({ user }: ForgotPwdCardProps) => {
  const pinUser = user === "teacher" || user === "student";

  const formSchema = useMemo(() => {
    if (pinUser) {
      return z.object({
        identifier: z
          .string()
          .trim()
          .min(1, { message: "Enter your email or ID" }),
      });
    }
    return z.object({
      identifier: z
        .string()
        .trim()
        .min(1, { message: "Enter your email" })
        .email({ message: "Please enter a valid email." }),
    });
  }, [pinUser]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { identifier: "" },
  });

  const pathname = usePathname();

  const getLoginUrl = useCallback(() => {
    if (pathname.includes("admin")) {
      return "/school-admin";
    } else if (pathname.includes("teacher")) {
      return "/teacher";
    } else if (pathname.includes("student")) {
      return "/student";
    } else return "/super-admin/auth";
  }, [pathname]);

  const { mutate, isPending } = useMutation({
    mutationFn: (body: ForgotPasswordBody) =>
      customAPI.post(`${getLoginUrl()}/forgot-password`, body),
  });

  useEffect(() => {
    getLoginUrl();
  }, [user, getLoginUrl]);

  const router = useRouter();

  const requestPwdReset = (data: FormData) => {
    const trimmed = data.identifier.trim();
    const body: ForgotPasswordBody = pinUser
      ? { identifier: trimmed }
      : { email: trimmed };
    mutate(body, {
      onSuccess: (res) => {
        toast.success(res.data.message);
        if (user) {
          router.push(`/auth/${user}/forgotPassword/resetSuccess`);
        }
      },
      onError: (error) => {
        const msg =
          error instanceof AxiosError
            ? (error.response?.data as { message?: string } | undefined)
                ?.message
            : undefined;
        toast.error(msg || "An error occurred");
      },
    });
  };

  return (
    <section className="relative px-10 py-12 rounded-3xl border border-white border-solid bg-zinc-100 shadow-sm w-[475px] z-[1] max-md:max-w-[475px] max-md:w-[90%] max-sm:px-5 max-sm:py-8 max-sm:w-[95%]">
      <h1 className="mb-3.5 text-2xl font-bold text-neutral-800">
        Forgot {user && user !== "admin" ? "PIN" : "Password"}?
      </h1>
      <p className="mb-10 text-xs text-zinc-600">
        Enter{" "}
        {user && user !== "admin"
          ? "your email or ID"
          : "the email you used to sign up"}
      </p>
      <form method="POST" onSubmit={handleSubmit(requestPwdReset)}>
        <InputField
          label={user && user !== "admin" ? "Email or ID" : "Email"}
          {...register("identifier")}
          type={pinUser ? "text" : "email"}
          autoComplete={pinUser ? "username" : "email"}
          required
        />
        {errors.identifier && (
          <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
        )}
        <div className="relative mt-9 max-sm:mt-6">
          <ActionButton
            type={ButtonType.submit}
            text={
              user && user !== "admin"
                ? "Request PIN Reset"
                : "Request Password Reset"
            }
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
