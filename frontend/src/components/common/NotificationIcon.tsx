import React, { JSX } from "react";
import { NotificationType } from "@/@types";
import {
  IconUserCheck,
  IconCalendarCheck,
  IconFileText,
  IconBell,
} from "@tabler/icons-react";

interface NotificationIconProps {
  type: NotificationType;
}

const NotificationIcon = ({ type }: NotificationIconProps) => {
  const notificationTypeIconMap: Record<NotificationType, JSX.Element> = {
    [NotificationType.Admission]: <IconUserCheck color="#3b82f6" size={32} />,
    [NotificationType.Attendance]: (
      <IconCalendarCheck color="#ef4444" size={32} />
    ),
    [NotificationType.Results]: <IconFileText color="#eab308" size={32} />,
    [NotificationType.General]: <IconBell color="#9ca3af" size={32} />,
  };

  return (
    <div className="rounded-full shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100">
      {notificationTypeIconMap[type as NotificationType] || (
        <IconBell className="text-gray-400 w-10 h-10" />
      )}
    </div>
  );
};

export default NotificationIcon;
