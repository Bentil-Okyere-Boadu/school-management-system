"use client";

import { BadgeVariant, AdmissionStatus } from "@/@types";
import React from "react";
import { IconChevronDown } from "@tabler/icons-react";
import Loader from "../Loader";

interface BadgeProps {
  text: string;
  variant: BadgeVariant;
  showDot?: boolean;
  width?: string;
  showArrow?: boolean;
  loading?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ text, variant, width, showDot = false, showArrow = false, loading=false }) => {
    const getVariantStyles = (): { textColor: string; bgColor: string, dotColor: string } => {
        switch (variant) {
          case "purple":
            return {
              textColor: "text-violet-700",
              bgColor: "bg-purple-50",
              dotColor: "#7C3AED",
            };
          case "red":
          case AdmissionStatus.REJECTED:
            return {
              textColor: "text-red-600",
              bgColor: "bg-red-50",
              dotColor: "#F43F5E",
            };
          case "blue":
            return {
              textColor: "text-blue-700",
              bgColor: "bg-blue-50",
              dotColor: "#3B82F6",
            };
          case "green":
          case "active":
          case AdmissionStatus.ACCEPTED:
            return {
              textColor: "text-green-700",
              bgColor: "bg-green-50",
              dotColor: "#12B76A",
            };
          case "yellow":
          case "pending":
          case AdmissionStatus.SUBMITTED:          
            return {
              textColor: "text-yellow-700",
              bgColor: "bg-yellow-50",
              dotColor: "#FBBF24",
            };
          case "gray":
          case "inactive":
            return {
              textColor: "text-gray-500",
              bgColor: "bg-gray-200",
              dotColor: "#79747E",
            };
          case AdmissionStatus.WAITLISTED:
            return {
              textColor: "text-orange-700",
              bgColor: "bg-orange-50",
              dotColor: "#D67825",
            };
          default:
            return {
                textColor: "text-indigo-700",
                bgColor: "bg-indigo-50",
                dotColor: "#4F46E5",
            };
        }
      };

  const { textColor, bgColor, dotColor } = getVariantStyles();
  const widthClass = width || "w-auto";

  return (
    <div
      className={`flex items-start ${textColor} bg-blend-multiply ${widthClass}`}
    >
      <div
        className={`text-sm self-stretch px-3 py-1.5 ${bgColor} flex items-center rounded-xl min-h-[27px] ${widthClass} text-nowrap`}> 
        {showDot && (
            <svg
                width="9"
                height="8"
                viewBox="0 0 9 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1.5"
            >
                <circle cx="4.5" cy="4" r="3" fill={dotColor}></circle>
            </svg>
        )}
        {loading && <Loader color="" /> }
        <span>{text}</span>
        {showArrow && (
          <IconChevronDown className="object-contain w-6 aspect-square pl-2" />
        )}
      </div>
    </div>
  );
};

export default Badge;
