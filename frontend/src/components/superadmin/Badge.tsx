"use client";

import React from "react";

type BadgeVariant =
  | "purple"
  | "red"
  | "indigo"
  | "blue"
  | "green"
  | "yellow"
  | "grey";

interface BadgeProps {
  text: string;
  variant: BadgeVariant;
  showDot?: boolean;
  width?: string;
}

const Badge: React.FC<BadgeProps> = ({ text, variant, width, showDot = false }) => {
    const getVariantStyles = (): { textColor: string; bgColor: string, dotColor: string } => {
        switch (variant) {
          case "purple":
            return {
              textColor: "text-violet-700",
              bgColor: "bg-purple-50",
              dotColor: "#7C3AED",
            };
          case "red":
            return {
              textColor: "text-red-300",
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
            return {
              textColor: "text-green-700",
              bgColor: "bg-green-50",
              dotColor: "#12B76A",
            };
          case "yellow":
            return {
              textColor: "text-yellow-700",
              bgColor: "bg-yellow-50",
              dotColor: "#FBBF24",
            };
          case "grey":
            return {
              textColor: "text-gray-500",
              bgColor: "bg-gray-200",
              dotColor: "#79747E",
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
        className={`text-sm self-stretch px-3 py-1.5 ${bgColor} flex items-center rounded-xl min-h-[27px] ${widthClass} text-nowrap`}
      > {showDot && (
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
        <span>{text}</span>
      </div>
    </div>
  );
};

export default Badge;
