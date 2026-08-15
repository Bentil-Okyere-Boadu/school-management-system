import { useRef } from "react";
import { useClickOutside } from "../../utils/useClickOutside";
import { IconChevronRight } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { User } from "@/@types";
import {
  useGetNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
} from "@/hooks/school-admin";
import NotificationIcon from "./NotificationIcon";
import NoAvailableEmptyState from "./NoAvailableEmptyState";
import CustomUnderlinedButton from "./CustomUnderlinedButton";
import { formatRelativeTime, getNotificationTypeLabel } from "@/utils/notifications";

interface NotificationCardProps {
  onClose: () => void;
  user: User;
}

export default function NotificationCard({
  onClose,
  user,
}: NotificationCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);
  const router = useRouter();
  const schoolId = user.school.id;

  const { notifications } = useGetNotifications(schoolId);
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } =
    useMarkAllNotificationsAsRead();

  const latestNotifications = notifications.slice(0, 8);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const onHandleNotificationItemClick = (id: string) => {
    markAsRead(id, {
      onError: (err) => {
        console.error("Error marking notification as read:", err);
      },
    });

    router.push("/admin/notifications");
    onClose();
  };

  const onGoToNotificationsView = () => {
    router.push("/admin/notifications");
    onClose();
  };

  const onMarkAllRead = () => {
    if (!schoolId || unreadCount === 0 || isMarkingAll) {
      return;
    }
    markAllAsRead(schoolId, {
      onError: (err) => {
        console.error("Error marking all notifications as read:", err);
      },
    });
  };

  return (
    <div
      ref={ref}
      className="absolute right-8 top-16 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
    >
      <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
        <div className="flex justify-between items-center">
          <span>Notifications</span>
          <CustomUnderlinedButton
            text="Mark all read"
            textColor="text-purple-500 text-sm"
            onClick={onMarkAllRead}
            showIcon={false}
          />
        </div>
      </div>
      <ul className="max-h-96 overflow-y-auto">
        {latestNotifications.length > 0 ? (
          latestNotifications.map((n) => (
            <li
              onClick={() => onHandleNotificationItemClick(n?.id as string)}
              key={n.id}
              className={`px-4 py-2 flex items-center gap-3 cursor-pointer ${
                !n.read
                  ? "bg-purple-50 hover:bg-purple-100"
                  : "hover:bg-gray-50"
              }`}
            >
              <NotificationIcon type={n.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {getNotificationTypeLabel(n.type)}
                  {n.createdAt ? ` · ${formatRelativeTime(n.createdAt)}` : ""}
                </p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 bg-purple-500 rounded-full shrink-0" />
              )}
              <IconChevronRight color="#5A6474" className="w-4 h-4 shrink-0" />
            </li>
          ))
        ) : (
          <NoAvailableEmptyState message="No notifications available." />
        )}
      </ul>
      <div className="px-4 py-3 border-t border-gray-100">
        <CustomUnderlinedButton
          text="View all notifications"
          textColor="text-purple-500 text-sm"
          onClick={onGoToNotificationsView}
          showIcon={false}
        />
      </div>
    </div>
  );
}
