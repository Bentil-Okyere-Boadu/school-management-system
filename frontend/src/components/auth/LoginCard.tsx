"use client";
import React, { useEffect, useState } from "react";
import InputField from "../InputField";
import ActionButton from "../ActionButton";
import Link from "next/link";
import { useLogin } from "@/hooks/auth";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { handleLoginRedirectAndToken } from "@/middleware";
import { Roles } from "@/@types";
import { useAppContext } from "@/context/AppContext";

const LoginCard: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState("")
  const router = useRouter();
  const pathname = usePathname();

  // To set the user data
  const { setLoggedInUser } = useAppContext();
  useEffect(() => {
    getLoginUrl()
  }, [])
  
  const getLoginUrl = () => {
    if(pathname.includes('school-admin')){
      setUser('admin');
      return '/school-admin/login'
    } else if(pathname.includes('teacher')) {
      setUser(Roles.TEACHER);
      return '/teacher/login'
    } else if(pathname.includes('student')) {
      setUser(Roles.STUDENT);
      return '/student/login'
    } else return '/super-admin/auth/login';
  }

  const { mutate, isPending } = useLogin({ email, password });

  const handleSignIn = () => {
    // Handle sign in logic here
    mutate(getLoginUrl(), {
      onError: (error) => {
        toast.error((error as AxiosError).response.data.message);
      },
      onSuccess: (data) => {
        toast.success("Login successfully.");
        setLoggedInUser(data.data);
        handleLoginRedirectAndToken(data, router);
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
        label={user === Roles.TEACHER || user === Roles.STUDENT ? "ID or Email" : "Email"}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />

      <InputField
        label={user === Roles.TEACHER || user === Roles.STUDENT  ? "PIN" : "Password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        isPasswordField={true}
      />

      <Link href={user? `/auth/${user}/forgotPassword` : "/auth/forgotPassword"} className="w-[100px]">
        <p className="mt-3.5 text-xs text-right underline text-zinc-600 block ">
          Forgot {user === Roles.TEACHER || user === Roles.STUDENT ? "PIN" : "Password"}?
        </p>
      </Link>

      <div className="relative mt-9 max-sm:mt-6">
        <ActionButton
          onClick={handleSignIn}
          text="Sign In"
          loading={isPending}
        />
      </div>

      {user === Roles.TEACHER ? (
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
