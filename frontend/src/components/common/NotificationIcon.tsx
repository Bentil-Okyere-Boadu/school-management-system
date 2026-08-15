import React from "react";
import { NotificationType } from "@/@types";
import {
  IconUserCheck,
  IconCalendarCheck,
  IconFileText,
  IconBell,
  IconUsers,
  IconReceipt,
} from "@tabler/icons-react";
import { getNotificationCategory } from "@/utils/notifications";

interface NotificationIconProps {
  type: NotificationType | string;
  size?: number;
}

const NotificationIcon = ({ type, size = 20 }: NotificationIconProps) => {
  const category = getNotificationCategory(type);

  const iconByType: Partial<Record<NotificationType, React.ReactNode>> = {
    [NotificationType.Admission]: (
      <IconUserCheck color="#3b82f6" size={size} />
    ),
    [NotificationType.Attendance]: (
      <IconCalendarCheck color="#ef4444" size={size} />
    ),
    [NotificationType.Results]: <IconFileText color="#eab308" size={size} />,
    [NotificationType.ClassTeacherResultSubmission]: (
      <IconFileText color="#eab308" size={size} />
    ),
    [NotificationType.Fee]: <IconReceipt color="#059669" size={size} />,
    [NotificationType.ParentInvitation]: (
      <IconUsers color="#a855f7" size={size} />
    ),
    [NotificationType.ParentAccepted]: (
      <IconUsers color="#a855f7" size={size} />
    ),
    [NotificationType.ParentChildConfirmation]: (
      <IconUsers color="#a855f7" size={size} />
    ),
    [NotificationType.ParentChildConfirmed]: (
      <IconUsers color="#a855f7" size={size} />
    ),
    [NotificationType.ParentReviewRequired]: (
      <IconUsers color="#a855f7" size={size} />
    ),
    [NotificationType.ParentAccessRevoked]: (
      <IconUsers color="#a855f7" size={size} />
    ),
    [NotificationType.General]: <IconBell color="#9ca3af" size={size} />,
  };

  const backgroundByCategory: Record<string, string> = {
    admissions: "bg-blue-50",
    attendance: "bg-red-50",
    results: "bg-yellow-50",
    parents: "bg-purple-50",
    fees: "bg-emerald-50",
    general: "bg-gray-100",
  };

  return (
    <div
      className={`rounded-full shrink-0 w-10 h-10 flex items-center justify-center ${
        backgroundByCategory[category] ?? "bg-gray-100"
      }`}
    >
      {iconByType[type as NotificationType] || (
        <IconBell color="#9ca3af" size={size} />
      )}
    </div>
  );
};

export default NotificationIcon;
