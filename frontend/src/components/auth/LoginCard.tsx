"use client";
import React, { useState } from "react";
import InputField from "../InputField";
import ActionButton from "../ActionButton";
import Link from "next/link";
import { useLogin } from "@/hooks/auth";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

interface LoginCardProps {
  user?: string;
}

const LoginCard: React.FC = ({ user }: LoginCardProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  console.log(user);

  const { mutate, isPending } = useLogin({ email, password });

  const handleSignIn = () => {
    // Handle sign in logic here
    mutate(null as unknown as void, {
      onError: (error: AxiosError) => {
        toast.error(error.response.data.message);
        console.log(error);
      },
      onSuccess: (data) => {
        toast.success("Login successfully.");
        Cookies.set("authToken", data.data.access_token);
        router.push("/admin/dashboard");
      },
    });
  };

  return (
    <div className="relative px-10 py-12 rounded-3xl border border-white border-solid shadow-sm bg-zinc-100 w-[475px] z-[1] max-md:max-w-[475px] max-md:w-[90%] max-sm:px-5 max-sm:py-8 max-sm:w-[95%]">
      <h1 className="mb-3.5 text-2xl font-bold text-neutral-800">Log in</h1>
      <p className="mb-10 text-xs text-zinc-600">
        Enter your SMS account details
      </p>

      <InputField
        label={user ? "ID or Email" : "Email"}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />

      <InputField
        label={user ? "PIN" : "Password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        isPasswordField={true}
      />

      <Link href={user? `/auth/${user}/forgotPassword` : "/auth/forgotPassword"} className="w-[100px]">
        <p className="mt-3.5 text-xs text-right underline text-zinc-600 block ">
          Forgot {user ? "PIN" : "Password"}?
        </p>
      </Link>

      <div className="relative mt-9 max-sm:mt-6">
        <ActionButton
          onClick={handleSignIn}
          text="Sign In"
          loading={isPending}
        />
      </div>

      {user === "teacher" ? (
        <>
          <p className="mt-11 text-xs text-center text-zinc-600">
            Forgot Credentials?{" "}
            <Link href={`/auth/${user}/forgotPassword`}>
              <button className="font-semibold text-purple-500 cursor-pointer">
                Reset
              </button>
            </Link>
          </p>
        </>
      ) : (
        <></>
      )}
      {user ? (
        <></>
      ) : (
        <p className="mt-11 text-xs text-center text-zinc-600">
          Need an account?{" "}
          <Link href={"/auth/signup"}>
            <button className="font-semibold text-purple-500 cursor-pointer">
              Sign up
            </button>
          </Link>
        </p>
      )}
    </div>
  );
};

export default LoginCard;
