"use client";
import ActionButton from "@/components/ActionButton";
import { customAPI } from "../../../config/setup";
import { AxiosError } from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

const ConfirmChildCard = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const confirm = async () => {
    if (!token) {
      toast.error("Confirmation token is missing");
      return;
    }
    setLoading(true);
    try {
      await customAPI.post("/parent/relationships/confirm", { token });
      setConfirmed(true);
      toast.success(
        "Child confirmed. You can now view them in the parent portal.",
      );
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined;
      toast.error(message || "Unable to confirm this child");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative px-10 py-12 rounded-3xl border border-white border-solid shadow-sm bg-zinc-100 w-[475px] z-[1] max-md:max-w-[475px] max-md:w-[90%] max-sm:px-5 max-sm:py-8 max-sm:w-[95%]">
      <h1 className="mb-3.5 text-2xl font-bold text-neutral-800">
        Confirm child
      </h1>
      <p className="mb-10 text-xs text-zinc-600">
        {confirmed
          ? "This child is now linked to your parent account."
          : "Confirm that this student is your child to grant portal access."}
      </p>
      {!confirmed ? (
        <ActionButton onClick={confirm} text="Confirm child" loading={loading} />
      ) : null}
      <p className="mt-11 text-xs text-center text-zinc-600">
        <Link href="/auth/parent/login">
          <button className="font-semibold text-purple-500 cursor-pointer">
            Back to parent login
          </button>
        </Link>
      </p>
    </section>
  );
};

export default ConfirmChildCard;
