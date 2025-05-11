"use client";
import * as React from "react";

interface NoAvailableEmptyStateProps {
  readonly message?: string;
}

function NoAvailableEmptyState({
  message = "Available Empty"
}: NoAvailableEmptyStateProps) {
  return (
    <section className="flex justify-center p-8">
      <article className="flex flex-col gap-3 justify-center items-center w-[50%]">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[24px] h-[24px]"
        >
          <path
            d="M15.2004 8.7998L8.80039 15.1998M16.8004 0.799805H4.00039C3.57604 0.799805 3.16908 0.968376 2.86902 1.26843C2.56896 1.56849 2.40039 1.97546 2.40039 2.3998V21.5998C2.40039 22.0242 2.56896 22.4311 2.86902 22.7312C3.16908 23.0312 3.57604 23.1998 4.00039 23.1998H20.0004C20.4247 23.1998 20.8317 23.0312 21.1318 22.7312C21.4318 22.4311 21.6004 22.0242 21.6004 21.5998V5.5998L16.8004 0.799805ZM12.0004 16.7998C10.7274 16.7998 9.50645 16.2941 8.60628 15.3939C7.7061 14.4937 7.20039 13.2728 7.20039 11.9998C7.20039 10.7268 7.7061 9.50587 8.60628 8.60569C9.50645 7.70552 10.7274 7.1998 12.0004 7.1998C13.2734 7.1998 14.4943 7.70552 15.3945 8.60569C16.2947 9.50587 16.8004 10.7268 16.8004 11.9998C16.8004 13.2728 16.2947 14.4937 15.3945 15.3939C14.4943 16.2941 13.2734 16.7998 12.0004 16.7998Z"
            stroke="#828282"
          />
        </svg>
        <p className="text-sm font-normal text-center text-zinc-500">
          {message}
        </p>
      </article>
    </section>
  );
}

export default NoAvailableEmptyState;
