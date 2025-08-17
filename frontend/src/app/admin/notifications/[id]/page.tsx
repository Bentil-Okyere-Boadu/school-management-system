"use client";
import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import TabBar from "@/components/common/TabBar";
import { TabListItem } from "@/components/common/TabItem";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { useGetMe, useGetNotifications, useMarkNotificationAsRead } from "@/hooks/school-admin";
import { useQueryClient } from "@tanstack/react-query";
import NotificationIcon from "@/components/common/NotificationIcon";
import { NotificationSettings } from "@/components/admin/notifications/NotificationSettings";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";


const NotificationsPage: React.FC = () => {

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabKey, setActiveTabKey] = useState('all-notifications');

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "All Notifications", tabKey: "all-notifications" },
    { tabLabel: "Settings", tabKey: "settings" },
  ];

  const {me} = useGetMe();
  const schoolId = me?.school.id;
  const { notifications } = useGetNotifications(schoolId);
  const { mutate: markAsRead } = useMarkNotificationAsRead();

  const queryClient = useQueryClient();

  const handleReadNotification = (id: string) => {
    markAsRead(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
      onError: (err) => {
        console.error("Error marking notification as read:", err);
      }
    });
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log(searchQuery);
  };

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
  };

  return (
    <div className="px-0.5">
      <TabBar
        items={defaultNavItems}
        activeTabKey={activeTabKey}
        onItemClick={handleItemClick}
      />

      {activeTabKey === "all-notifications" && (
        <div>
          <SearchBar
            onSearch={handleSearch}
            className="w-[366px] max-md:w-full"
          />
          <div className="flex gap-3 mt-6">
            <CustomSelectTag
              value={"Week"}
              options={[{ label: "Week", value: "week" }]}
              onOptionItemClick={() => {}}
            />
            <CustomSelectTag
              value={"Month"}
              options={[{ label: "Month", value: "month" }]}
              onOptionItemClick={() => {}}
            />
            <CustomSelectTag
              value={"Year"}
              options={[{ label: "Year", value: "year" }]}
              onOptionItemClick={() => {}}
            />
          </div>

          <div className="max-w-2xl 2xl:max-w-3xl p-4 space-y-6 mt-4 max-h-2/4 overflow-y-auto">
            { notifications.length > 0 ? notifications.map((note) => (
              <div key={note.id} className="flex items-start gap-3">
                <span
                  onClick={() => handleReadNotification(note.id as string)}
                  className={`cursor-pointer h-2 w-2 mt-2 rounded-full shrink-0 ${
                    !note.read ? "bg-purple-500" : "opacity-0"
                  }`}
                ></span>

                <div className="flex gap-3">
                  <NotificationIcon type={note.type} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{note.title}</span> <br />
                      <span className="text-gray-700">{note.message}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{note.type}</p>
                  </div>
                </div>
              </div>
            )) : (
                <NoAvailableEmptyState message="No notifications available." />
            )}
          </div>
        </div>
      )}

      {activeTabKey === "settings" && (
        <NotificationSettings />
      )}
    </div>
  );
};

export default NotificationsPage;