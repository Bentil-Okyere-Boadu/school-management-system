"use client";
import React, { useState } from 'react'
import { AdmissionsAnalyticsTabSection } from '@/components/admin/admissions/AdmissionsAnalyticsTabSection';
import { AdmissionsListTabSection } from '@/components/admin/admissions/AdmissionsListTabSection';
import TabBar from '@/components/common/TabBar';
import { useGetMe, useGetSchoolAdmissions } from '@/hooks/school-admin';
import { Button } from '@mantine/core';
import { IconCopy } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { useDebouncer } from "@/hooks/generalHooks";
import { Pagination } from "@/components/common/Pagination";

export interface MetricCardProps {
  value: string;
  label: string;
  icon: string;
  trend: {
    direction: 'up' | 'down';
    percentage: string;
  };
}

export type TabListItem = {
  tabLabel: string;
  tabKey: string;
};

const Admissions = () => {
  const [isCopied, setIsCopied] = useState(false);

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "Admissions Analytics", tabKey: "admissions-analytics" },
    { tabLabel: "Admissions List", tabKey: "admissions-list" },
  ];
  const [activeTabKey, setActiveTabKey] = useState('admissions-analytics');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
  };

  const {me} = useGetMe();

  const goToAdmissionFormsPage = () => {
    const frontendBaseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    const schoolId = me.school.id;
    const admissionsLink = `${frontendBaseUrl}/admission-forms/${schoolId}`;

    window.open(admissionsLink, "_blank");
  }

  const copyText = async (schoolId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
    const textToCopy = baseUrl + '/admission-forms/' + schoolId;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() =>{
        if(isCopied) {
          toast.success('Admission link copied to clipboard.')
        }

        setIsCopied(false)
      }, 1500); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = (query: string) => {
    setSelectedStatus(query);
    setCurrentPage(1);
  };

  const { admissionsList, paginationValues } = useGetSchoolAdmissions(currentPage, useDebouncer(searchQuery), selectedStatus, "", "", 10);

  return (
    <div>
      <div className='flex justify-between'>
        <TabBar 
          items={defaultNavItems} 
          activeTabKey={activeTabKey} 
          onItemClick={handleItemClick}
        />

        <div className='flex gap-2 flex-wrap'>
          <Button 
            leftSection={<IconCopy size={24}/>}
            onClick={() => copyText(`${me.school.id}`)}>
              Copy Admissions link
            </Button> 

          <Button
            onClick={() => goToAdmissionFormsPage()}>
              Go to Admissions Form
            </Button> 

        </div>
      </div>

      {activeTabKey === "admissions-analytics" && (
        <div>
          <AdmissionsAnalyticsTabSection  />
        </div>
      )}

      {activeTabKey === "admissions-list" && (
        <div>
          <AdmissionsListTabSection 
            handleSearch={handleSearch} 
            handleStatusChange={handleStatusChange}
            selectedStatus={selectedStatus}
            admissionsList={admissionsList} 
          />
          <Pagination
            currentPage={currentPage}
            totalPages={paginationValues?.totalPages || 1}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}

export default Admissions;