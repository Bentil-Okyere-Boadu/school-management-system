import React from "react";

interface StatusBadgeProps {
  status: "active" | "inactive";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const dotColor = status === "active" ? "#12B76A" : "#79747E";

  return (
    <div className="flex items-center px-2 py-0.5 text-base rounded-2xl">
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
      <span>{status === "active" ? "Active" : "Inactive"}</span>
    </div>
  );
};
