"use client";
import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import TabBar from "@/components/common/TabBar";
import { TabListItem } from "@/components/common/TabItem";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import CustomUnderlinedButton from "@/components/admin/CustomUnderlinedButton";
import InputField from "@/components/InputField";
import { Textarea } from "@mantine/core";
import { useGetMe, useGetNotifications, useMarkNotificationAsRead } from "@/hooks/school-admin";
import { useQueryClient } from "@tanstack/react-query";
import NotificationIcon from "@/components/common/NotificationIcon";


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

  const feesStructure = [1, 2];

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
        <div>
          <SearchBar
            onSearch={handleSearch}
            className="w-[366px] max-md:w-full"
          />

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-5">
              <h1 className="text-md font-semibold text-neutral-800">
                Message Reminders
              </h1>
              <CustomUnderlinedButton
                text="Add New"
                textColor="text-purple-500"
                onClick={() => {}}
                showIcon={false}
              />
            </div>
            <div className="flex flex-col gap-4 mb-12 max-w-xl">
              {feesStructure.length > 0 ? (
                feesStructure?.map((feeStructure, index) => {
                  return (
                    <div
                      key={index}
                      className="bg-[#EAEAEAB3] px-6 pt-2 pb-6 rounded-sm"
                    >
                      <div className="flex justify-end gap-3">
                        <CustomUnderlinedButton
                          text="Edit"
                          textColor="text-gray-500"
                          onClick={() => {}}
                          showIcon={false}
                        />
                        <CustomUnderlinedButton
                          text="Delete"
                          textColor="text-gray-500"
                          onClick={() => {}}
                          showIcon={false}
                        />
                      </div>
                      <div className="grid gap-1 md:gap-3 grid-cols-1">
                        <InputField
                          label="Message Title"
                          isTransulent={false}
                          value={""}
                          readOnly={true}
                        />
                        <Textarea
                          label="Message"
                          placeholder=""
                          autosize
                          minRows={5}
                          maxRows={8}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <NoAvailableEmptyState message="No Message Reminders available, click ‘Add New’ to create one." />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;