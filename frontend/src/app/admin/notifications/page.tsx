"use client";
import React, { useState } from "react";
import TabBar from "@/components/common/TabBar";
import { TabListItem } from "@/components/common/TabItem";
import { useGetMe } from "@/hooks/school-admin";
import { NotificationSettings } from "@/components/admin/notifications/NotificationSettings";
import { NotificationInbox } from "@/components/admin/notifications/NotificationInbox";
import { useSearchParams, useRouter } from "next/navigation";

const NotificationsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(
    tabFromUrl || "all-notifications",
  );

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "All Notifications", tabKey: "all-notifications" },
    { tabLabel: "Settings", tabKey: "settings" },
  ];

  const setTabInUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  const { me } = useGetMe();
  const schoolId = me?.school.id;

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
    setTabInUrl(item.tabKey);
  };

  return (
    <div className="px-0.5">
      <TabBar
        items={defaultNavItems}
        activeTabKey={activeTabKey}
        onItemClick={handleItemClick}
      />

      {activeTabKey === "all-notifications" && (
        <NotificationInbox schoolId={schoolId} />
      )}

      {activeTabKey === "settings" && <NotificationSettings />}
    </div>
  );
};

export default NotificationsPage;
