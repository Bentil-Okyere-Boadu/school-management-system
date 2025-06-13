"use client";

import React from "react";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { Menu } from "@mantine/core";
import Badge from "@/components/common/Badge";
import { BadgeVariant } from "@/@types";

export interface OptionProps {
  label: string;
  value: string;
}

export interface StatusMenuProps {
  status: string;
  onStatusClick?: (item: OptionProps) => void
}

export const AdmissionStatusMenu: React.FC<StatusMenuProps> = ({ status, onStatusClick}) => {

  const getOptionsByStatus = (status: string): OptionProps[] => {
    switch (status) {
      case "in_progress":
        return [
            { label: "Mark Completed", value: "mark-completed" },
            { label: "Accept Application", value: "accept-application" },
            { label: "Reject Application", value: "reject-appplication" },
        ];
      case "app-submitted":
        return [
            { label: "Send Interview Invite", value: "send-interview-invite" },
            { label: "Accept Application", value: "accept-application" },
            { label: "Reject Application", value: "reject-appplication" },
            { label: "Waitlist Application", value: "waitlist-application" },
        ];
      case "interview-pending":
        return [
            { label: "Mark Completed", value: "mark-completed" },
            { label: "Accept Application", value: "accept-application" },
            { label: "Reject Application", value: "reject-appplication" },
            { label: "Waitlist Application", value: "waitlist-application" },
        ];
      case "interview-completed":
        return [
            { label: "Accept Application", value: "accept-application" },
            { label: "Reject Application", value: "reject-appplication" },
            { label: "Waitlist Application", value: "waitlist-application" },
        ];
      case "waitlisted":
        return [
            { label: "Accept Application", value: "accept-application" },
            { label: "Reject Application", value: "reject-appplication" },
        ];
      default:
        return [{label: "No results", value: ""}];
    }
  };

  const statusOptionsList = getOptionsByStatus(status);

  return (
    <Menu shadow="md" width={190} position="bottom-start">
      <Menu.Target>
        <div className={`${onStatusClick ? 'cursor-pointer' : ''}`}>
          <Badge
            text={capitalizeFirstLetter(status)}
            showDot={true}
            showArrow={true}
            variant={status as BadgeVariant}
          />
        </div>
      </Menu.Target>
      <Menu.Dropdown className="!-mt-1">
        {statusOptionsList.map((option, index) => (
          <Menu.Item
            key={index}
            onClick={() => onStatusClick?.(option)}
          >
            {option.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
