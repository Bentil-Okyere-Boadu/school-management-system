"use client";

import React, { useState } from "react";
import { NotificationInbox } from "@/components/admin/notifications/NotificationInbox";
import { useStudentGetMe, useDeleteMyNotification, useGetMyNotifications, useMarkAllMyNotificationsAsRead, useMarkMyNotificationAsRead } from "@/hooks/student";
import { TEACHER_STUDENT_NOTIFICATION_CATEGORIES } from "@/utils/notifications";

const StudentNotificationsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { me } = useStudentGetMe();
  const { notifications } = useGetMyNotifications(me?.id, searchQuery);
  const { mutate: markAsRead } = useMarkMyNotificationAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } =
    useMarkAllMyNotificationsAsRead();
  const { mutate: deleteNotification } = useDeleteMyNotification();

  return (
    <div className="px-0.5">
      <NotificationInbox
        notifications={notifications}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        categories={TEACHER_STUDENT_NOTIFICATION_CATEGORIES}
        isMarkingAll={isMarkingAll}
        onMarkRead={(id) =>
          markAsRead(id, {
            onError: (err) => {
              console.error("Error marking notification as read:", err);
            },
          })
        }
        onDelete={(id) =>
          deleteNotification(id, {
            onError: (err) => {
              console.error("Error deleting notification:", err);
            },
          })
        }
        onMarkAllRead={() =>
          markAllAsRead(undefined, {
            onError: (err) => {
              console.error("Error marking all notifications as read:", err);
            },
          })
        }
      />
    </div>
  );
};

export default StudentNotificationsPage;
