"use client";
import React, { useState } from 'react'
import { AdmissionsAnalyticsTabSection } from '@/components/admin/admissions/AdmissionsAnalyticsTabSection';
import { AdmissionsListTabSection } from '@/components/admin/admissions/AdmissionsListTabSection';
import TabBar from '@/components/common/TabBar';
import { useGetMe, useGetSchoolAdmissions } from '@/hooks/school-admin';
import { Button } from '@mantine/core';
import { IconCopy, IconExternalLink } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { useDebouncer } from "@/hooks/generalHooks";
import { Pagination } from "@/components/common/Pagination";
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultNavItems: TabListItem[] = [
    { tabLabel: "Admissions Analytics", tabKey: "admissions-analytics" },
    { tabLabel: "Admissions List", tabKey: "admissions-list" },
  ];
  const tabFromUrl = searchParams.get("tab");
  const [activeTabKey, setActiveTabKey] = useState(tabFromUrl || 'admissions-analytics');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterStatus, setSelectedFilterStatus] = useState("");

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
    setTabInUrl(item.tabKey);
  };

  const setTabInUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
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
      if(isCopied) {
        toast.success('Admission link copied to clipboard.')
      }

      setIsCopied(false)
      
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('copy failed');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterStatusChange = (query: string) => {
    setSelectedFilterStatus(query);
    setCurrentPage(1);
  };

  const { admissionsList, paginationValues, refetch: refetchAdmissionList, isLoading } = useGetSchoolAdmissions(currentPage, useDebouncer(searchQuery), selectedFilterStatus, "", "", 10);

  return (
    <div>
       <div className='flex justify-between'>
        <TabBar 
          items={defaultNavItems} 
          activeTabKey={activeTabKey} 
          onItemClick={handleItemClick}
        />

        <div className='flex row items-center'>
          <Button 
            leftSection={<IconExternalLink/>}
            onClick={() => goToAdmissionFormsPage()}>
              Go to Admissions Form
          </Button>

          <IconCopy 
            className='ml-2 cursor-pointer' 
            onClick={async() => await copyText(`${me?.school?.id}`)} 
            size={24}
            color='#BE4BDB'
            textAnchor='Copy link'
            />
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
            handleFilterStatusChange={handleFilterStatusChange}
            selectedFilterStatus={selectedFilterStatus}
            admissionsList={admissionsList} 
            refetchAdmissionList={refetchAdmissionList}
            busy={isLoading}
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