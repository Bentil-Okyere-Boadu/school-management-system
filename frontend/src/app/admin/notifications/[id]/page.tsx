"use client";
import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import TabBar from "@/components/common/TabBar";
import { TabListItem } from "@/components/common/TabItem";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import Image from 'next/image';
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import CustomUnderlinedButton from "@/components/admin/CustomUnderlinedButton";
import InputField from "@/components/InputField";
import { Textarea } from "@mantine/core";

interface Notification {
  id: number;
  avatar: string;
  name: string;
  message: string;
  time: string;
  highlight?: boolean;
}


const NotificationsPage: React.FC = () => {

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabKey, setActiveTabKey] = useState('all-notifications');

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "All Notifications", tabKey: "all-notifications" },
    { tabLabel: "Settings", tabKey: "settings" },
  ];

  const notifications: Notification[] = [
    {
      id: 1,
      avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true',
      name: 'Brian Griffin',
      message: 'wants to collaborate',
      time: '5 days ago',
      highlight: true,
    },
    {
      id: 2,
      avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true',
      name: 'Adam from The Mayor\'s Office',
      message: 'Hey Peter, we’ve got a new user research opportunity for you. Adam from The Mayor’s Office is looking for people like you',
      time: '1 month ago',
    },
    {
      id: 3,
      avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true',
      name: 'Neil',
      message: 'Hey Peter, we’ve got a new user research opportunity for you. Neil is looking for people like you',
      time: '1 month ago',
      highlight: true
    },
    {
      id: 4,
      avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true',
      name: 'Cleveland from The Post Office',
      message: 'Hey Peter, we’ve got a new side project opportunity for you. Cleveland from The Post Office is looking for people like you.',
      time: '1 month ago',
    },
    {
      id: 5,
      avatar: 'https://cdn.builder.io/api/v1/image/assets/TEMP/5cdc8e15cdd19351c9962680fff3b3636cd00e80?placeholderIfAbsent=true',
      name: 'Joe',
      message: 'Hey Peter, we’ve got a new user research opportunity for you. Joe is looking for people like you today here!',
      time: '2 months ago',
    },
  ];

  const feesStructure = [1, 2];
  
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
            <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />
            <div className="flex gap-3 mt-6">
              <CustomSelectTag value={'Week'} options={[{label: 'Week', value: 'week'}]} onOptionItemClick={()=>{}} />
              <CustomSelectTag value={'Month'} options={[{label: 'Month', value: 'month'}]} onOptionItemClick={()=>{}} />
              <CustomSelectTag value={'Year'} options={[{label: 'Year', value: 'year'}]} onOptionItemClick={()=>{}} />
            </div>

            <div className="max-w-2xl 2xl:max-w-3xl p-4 space-y-6 mt-4">
              {notifications.map((note) => (
                <div key={note.id} className="flex items-start gap-3">
                  <span
                    className={`h-2 w-2 mt-2 rounded-full shrink-0 ${
                      note.highlight ? 'bg-purple-500' : 'opacity-0'
                    }`}
                  ></span>

                  <div className="flex gap-3">
                    <Image
                      src={note.avatar}
                      alt={note.name}
                      width={40}
                      height={40}
                      className="rounded-full shrink-0 w-10 h-10"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{note.name}</span>{' '}
                        <span className="text-gray-700">{note.message}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{note.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {activeTabKey === "settings" && (
          <div>
            <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />

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
                {
                  feesStructure.length > 0? feesStructure?.map((feeStructure, index) => {
                    return (
                      <div key={index} className="bg-[#EAEAEAB3] px-6 pt-2 pb-6 rounded-sm">
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
                            value={''}
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
                  }) : (
                    <NoAvailableEmptyState message="No Message Reminders available, click ‘Add New’ to create one." />
                  )
                }
              </div>
            </div>
          </div>
        )}

    </div>
  );
};

export default NotificationsPage;