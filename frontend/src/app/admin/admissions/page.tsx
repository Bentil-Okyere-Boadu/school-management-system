"use client";
import { AdmissionsAnalyticsTabSection } from '@/components/admin/admissions/AdmissionsAnalyticsTabSection';
import { AdmissionsListTabSection } from '@/components/admin/admissions/AdmissionsListTabSection';
import TabBar from '@/components/common/TabBar';
import { useGetMe } from '@/hooks/school-admin';
import { Button } from '@mantine/core';
import { IconCopy, IconExternalLink } from '@tabler/icons-react';
import React, { useState } from 'react'
import { toast } from 'react-toastify';

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

  const handleItemClick = (item: TabListItem) => {
    setActiveTabKey(item.tabKey);
  };

    const {me} = useGetMe();

  const goToAdmissionFormsPage = () => {
    const frontendBaseUrl = process.env.NEXT_PUBLIC_FRONEND_URL;
    const schoolId = me.school.id;
    const admissionsLink = `${frontendBaseUrl}/admission-forms/${schoolId}`;

    window.open(admissionsLink, "_blank");
  }

  const copyText = async (schoolId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_FRONEND_URL;
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
            onClick={async() => await copyText(`${me.school.id}`)} 
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
          <AdmissionsListTabSection  />
        </div>
      )}
    </div>
  )
}

export default Admissions;