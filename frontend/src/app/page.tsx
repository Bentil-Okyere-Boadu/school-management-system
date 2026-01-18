"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import getQueryClient from "@/utils/getQueryClient";

export default function Home() {
  const queryClient = getQueryClient()
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/home');
  }, [router])
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
    </HydrationBoundary>
  );
}
