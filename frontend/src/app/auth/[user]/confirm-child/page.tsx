import AuthBg from "@/components/auth/AuthBg";
import ConfirmChildCard from "@/components/auth/ConfirmChildCard";
import React, { Suspense } from "react";

export function generateStaticParams() {
  return [{ user: "parent" }];
}

export const dynamicParams = false;

const ConfirmChildPage = () => {
  return (
    <AuthBg>
      <Suspense fallback={null}>
        <ConfirmChildCard />
      </Suspense>
    </AuthBg>
  );
};

export default ConfirmChildPage;
