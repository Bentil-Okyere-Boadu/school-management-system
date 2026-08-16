"use client";

import React, { useMemo, useState } from "react";
import { IconTrash } from "@tabler/icons-react";
import { Notification } from "@/@types";
import { SearchBar } from "@/components/common/SearchBar";
import NotificationIcon from "@/components/common/NotificationIcon";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import CustomButton from "@/components/Button";
import {
  useDeleteNotification,
  useGetNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
} from "@/hooks/school-admin";
import {
  formatRelativeTime,
  getNotificationCategory,
  getNotificationTypeLabel,
  groupNotificationsByCategory,
  NOTIFICATION_CATEGORY_LABELS,
  ADMIN_NOTIFICATION_CATEGORIES,
  NotificationCategory,
} from "@/utils/notifications";

type InboxFilter = "all" | "unread" | NotificationCategory;

interface NotificationInboxProps {
  schoolId?: string;
  notifications?: Notification[];
  searchQuery?: string;
  onSearch?: (query: string) => void;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkAllRead?: () => void;
  isMarkingAll?: boolean;
  categories?: NotificationCategory[];
}

const NotificationInboxItem: React.FC<{
  note: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ note, onRead, onDelete }) => {
  return (
    <div
      onClick={() => onRead(note.id as string)}
      className={`flex items-start gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer ${
        !note.read
          ? "bg-purple-50 hover:bg-purple-100"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      <span
        className={`h-2 w-2 mt-2 rounded-full shrink-0 ${
          !note.read ? "bg-purple-500" : "opacity-0"
        }`}
      />
      <NotificationIcon type={note.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-semibold">{note.title}</span>
          <br />
          <span className="text-gray-700 line-clamp-2">{note.message}</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {getNotificationTypeLabel(note.type)}
          {note.createdAt ? ` · ${formatRelativeTime(note.createdAt)}` : ""}
        </p>
      </div>
      <button
        type="button"
        aria-label="Delete notification"
        className="text-gray-400 hover:text-red-500 shrink-0 mt-1"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(note.id as string);
        }}
      >
        <IconTrash size={16} />
      </button>
    </div>
  );
};

export const NotificationInbox: React.FC<NotificationInboxProps> = ({
  schoolId,
  notifications: notificationsProp,
  searchQuery: searchQueryProp,
  onSearch,
  onMarkRead,
  onDelete,
  onMarkAllRead,
  isMarkingAll: isMarkingAllProp,
  categories = ADMIN_NOTIFICATION_CATEGORIES,
}) => {
  const [internalSearch, setInternalSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");
  const searchQuery = searchQueryProp ?? internalSearch;

  const { notifications: adminNotifications } = useGetNotifications(
    schoolId,
    searchQuery,
  );
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllAdmin } =
    useMarkAllNotificationsAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const notifications = notificationsProp ?? adminNotifications;
  const isMarkingAll = isMarkingAllProp ?? isMarkingAllAdmin;
  const unreadCount = notifications.filter((note) => !note.read).length;

  const filterPills: Array<{ key: InboxFilter; label: string }> = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    ...categories.map((category) => ({
      key: category as InboxFilter,
      label: NOTIFICATION_CATEGORY_LABELS[category],
    })),
  ];

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") {
      return notifications;
    }
    if (activeFilter === "unread") {
      return notifications.filter((note) => !note.read);
    }
    return notifications.filter(
      (note) => getNotificationCategory(note.type) === activeFilter,
    );
  }, [activeFilter, notifications]);

  const groupedNotifications = useMemo(
    () => groupNotificationsByCategory(filteredNotifications, categories),
    [categories, filteredNotifications],
  );

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
      return;
    }
    setInternalSearch(query);
  };

  const handleReadNotification = (id: string) => {
    if (onMarkRead) {
      onMarkRead(id);
      return;
    }
    markAsRead(id, {
      onError: (err) => {
        console.error("Error marking notification as read:", err);
      },
    });
  };

  const handleDeleteNotification = (id: string) => {
    if (onDelete) {
      onDelete(id);
      return;
    }
    deleteNotification(id, {
      onError: (err) => {
        console.error("Error deleting notification:", err);
      },
    });
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || isMarkingAll) {
      return;
    }
    if (onMarkAllRead) {
      onMarkAllRead();
      return;
    }
    if (!schoolId) {
      return;
    }
    markAllAsRead(schoolId, {
      onError: (err) => {
        console.error("Error marking all notifications as read:", err);
      },
    });
  };

  const unreadLabel = `${unreadCount} unread`;
  const markAllDisabled = unreadCount === 0 || isMarkingAll || (!onMarkAllRead && !schoolId);

  return (
    <div>
      <SearchBar
        onSearch={handleSearch}
        value={searchQuery}
        className="w-[366px] max-md:w-full"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
        <p className="text-sm text-gray-500">{unreadLabel}</p>
        <CustomButton
          text="Mark all as read"
          variant="outline"
          disabled={markAllDisabled}
          onClick={handleMarkAllRead}
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {filterPills.map((pill) => {
          const isActive = activeFilter === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setActiveFilter(pill.key)}
              className={`px-3 py-1.5 text-sm rounded-full border cursor-pointer transition-colors ${
                isActive
                  ? "bg-purple-500 text-white border-purple-500"
                  : "bg-white text-gray-700 border-gray-200 hover:border-purple-300"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-2xl 2xl:max-w-3xl py-4 space-y-6 mt-2 max-h-2/4 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <NoAvailableEmptyState message="No notifications available." />
        ) : activeFilter === "all" ? (
          groupedNotifications.map((group) => (
            <section key={group.category} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {NOTIFICATION_CATEGORY_LABELS[group.category]}
              </h3>
              <div className="space-y-3">
                {group.items.map((note) => (
                  <NotificationInboxItem
                    key={note.id}
                    note={note}
                    onRead={handleReadNotification}
                    onDelete={handleDeleteNotification}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((note) => (
              <NotificationInboxItem
                key={note.id}
                note={note}
                onRead={handleReadNotification}
                onDelete={handleDeleteNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
