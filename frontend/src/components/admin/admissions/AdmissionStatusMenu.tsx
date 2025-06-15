"use client";

import React from "react";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { Menu } from "@mantine/core";
import Badge from "@/components/common/Badge";
import { BadgeVariant, AdmissionStatus } from "@/@types";

export interface OptionProps {
  label: string;
  value: string;
}

export interface StatusMenuProps {
  status: string;
  admissionId: string;
  onStatusClick?: (item: OptionProps, admissionId: string) => void
}

export const AdmissionStatusMenu: React.FC<StatusMenuProps> = ({ status, admissionId, onStatusClick}) => {

  const getOptionsByStatus = (status: string): OptionProps[] => {
    switch (status) {
      case AdmissionStatus.SUBMITTED:
        return [
            { label: "Send Interview Invite", value: "interview-invite" },
            { label: "Accept Application", value: AdmissionStatus.ACCEPTED},
            { label: "Reject Application", value: AdmissionStatus.REJECTED },
            { label: "Waitlist Application", value: AdmissionStatus.WAITLISTED},
        ];
      case AdmissionStatus.INTERVIEW_PENDING:
        return [
            { label: "Mark Completed", value: AdmissionStatus.INTERVIEW_COMPLETED },
            { label: "Accept Application", value: AdmissionStatus.ACCEPTED },
            { label: "Reject Application", value: AdmissionStatus.REJECTED },
            { label: "Waitlist Application", value: AdmissionStatus.WAITLISTED },
        ];
      case AdmissionStatus.INTERVIEW_COMPLETED:
        return [
            { label: "Accept Application", value: AdmissionStatus.ACCEPTED },
            { label: "Reject Application", value: AdmissionStatus.REJECTED },
            { label: "Waitlist Application", value: AdmissionStatus.WAITLISTED },
        ];
      case AdmissionStatus.WAITLISTED:
        return [
            { label: "Accept Application", value: AdmissionStatus.ACCEPTED },
            { label: "Reject Application", value: AdmissionStatus.REJECTED },
        ];
      default:
        return [{label: "No results", value: ""}];
    }
  };

  const statusOptionsList = getOptionsByStatus(status);
  const canOpenDropdown = ![AdmissionStatus.ACCEPTED, AdmissionStatus.REJECTED].includes(status as AdmissionStatus);

  return (
    <Menu shadow="md" width={190} position="bottom-start">
      <Menu.Target>
        <div className={`${onStatusClick && canOpenDropdown ? 'cursor-pointer' : ''}`}>
          <Badge
            text={capitalizeFirstLetter(status)}
            showDot={true}
            showArrow={canOpenDropdown}
            variant={status as BadgeVariant}
          />
        </div>
      </Menu.Target>

      {/* Only show dropdown if status is not ACCEPTED or REJECTED */}
      {canOpenDropdown && (
        <Menu.Dropdown className="!-mt-1">
          {statusOptionsList.map((option, index) => (
            <Menu.Item
              key={index}
              onClick={() => onStatusClick?.(option, admissionId)}
            >
              {option.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      )}
    </Menu>
  );
};
