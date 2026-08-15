"use client";
import { customAPI } from "../../../config/setup";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import React from "react";

type ParentMe = {
  firstName?: string;
  lastName?: string;
  email?: string;
  children?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    studentId?: string;
  }>;
};

const ParentHome = () => {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-me"],
    queryFn: async () => {
      const response = await customAPI.get("/parent/me");
      return response.data as ParentMe;
    },
  });

  const logout = () => {
    Cookies.remove("parentToken");
    Cookies.remove("parentTokenRefresh");
    router.push("/home");
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Parent portal</p>
            <h1 className="text-2xl font-bold text-neutral-800">
              {isLoading
                ? "Loading..."
                : `Welcome${data?.firstName ? `, ${data.firstName}` : ""}`}
            </h1>
          </div>
          <button
            onClick={logout}
            className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white"
          >
            Log out
          </button>
        </div>
        {error ? (
          <p className="text-sm text-red-600">
            Unable to load your parent account.
          </p>
        ) : (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-800">
              Linked children
            </h2>
            {!data?.children?.length ? (
              <p className="text-sm text-zinc-600">
                No active children yet. Confirm any pending child invitations
                from your email.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.children.map((child) => (
                  <li
                    key={child.id}
                    className="rounded-xl border border-zinc-100 px-4 py-3"
                  >
                    <p className="font-medium text-neutral-800">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-xs text-zinc-500">{child.studentId}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default ParentHome;
