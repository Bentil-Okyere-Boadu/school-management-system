"use client";
import CustomButton from "@/components/Button";
import { IconUpload } from "@tabler/icons-react";
import React, { useState } from "react";
import NoAvailableEmptyState from "../NoAvailableEmptyState";
import CustomUnderlinedButton from "../CustomUnderlinedButton";
import InputField from "@/components/InputField";
import { GradingSystemTable } from "./GradingSystemTable";
import SchoolCard from "@/components/common/SchoolCard";
import DocumentItem from "@/components/common/DocumentItem";
import { Dialog } from "@/components/common/Dialog";
import { MultiSelect, Select } from "@mantine/core";
// import { FeeStructureTable } from "./FeeStructureTable";
// import { GradingSystemTable } from "./GradingSystemTable";


export const SchoolSettingsTabSection: React.FC = () => {

  const [isFeeStructureDialogOpen, setIsFeeStructureDialogOpen] = useState(false);
  const [selectedDataRole, setSelectedDataRole] = useState<string>("school_admin");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["manage-users"]);
    const [isConfirmDeleteFeeStructureDialogOpen, setIsConfirmDeleteFeeStructureDialogOpen] = useState(false);
  const roles = [
    { value: "school_admin", label: "School Admin" },
    { value: "teacher", label: "Teacher" },
    { value: "student", label: "Student" }
  ];
  const permissions = [
    { value: "manage-users", label: "Manage Users" },
    { value: "assign-grades", label: "Assign Grades" },
    { value: "view-reports", label: "View Reports" },
    { value: "data-reports", label: "Data Reports" }
  ];
  
  const documents = [
    {
      id: 1,
      name: "Admission Policy 2.0 .pdf",
      width: "231px",
    },
    {
      id: 2,
      name: "Fee Policy .pdf",
      width: "160px", // w-40 = 10rem = 160px
    },
    {
      id: 3,
      name: "Admission Policy 3.0 .pdf",
      width: "232px",
    },
  ];

  const handleRoleDataChange = (value: string) => {
    setSelectedDataRole(value);
  };

  const handlePermissionChange = (value: string[]) => {
    setSelectedPermissions(value)
    console.log("Selected permissions:", value);
  };

  return (
    <div className="pb-16">

      <div className="flex justify-end">
        <CustomButton text="Save Changes" onClick={() => {}} />
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2">
          <h1 className="text-md font-semibold text-neutral-800">Fee Structure</h1>
          <CustomUnderlinedButton
            text="Add New"
            textColor="text-purple-500"
            onClick={() => setIsFeeStructureDialogOpen(true)}
            icon={<IconUpload size={10} />}
            showIcon={false}
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-[#EAEAEAB3] px-6 py-2 rounded-sm">
            <div className="flex justify-end gap-3">
              <CustomUnderlinedButton
                text="Edit"
                textColor="text-gray-500"
                onClick={() => setIsFeeStructureDialogOpen(true)}
                icon={<IconUpload size={10} />}
                showIcon={false}
              />
              <CustomUnderlinedButton
                text="Send Reminder"
                textColor="text-gray-500"
                onClick={() => {}}
                icon={<IconUpload size={10} />}
                showIcon={false}
              />
              <CustomUnderlinedButton
                text="Delete"
                textColor="text-gray-500"
                onClick={() => setIsConfirmDeleteFeeStructureDialogOpen(true)}
                icon={<IconUpload size={10} />}
                showIcon={false}
              />
            </div>
            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2">
              <InputField
                  label="Fee Title"
                  isTransulent={false}
                  value={''}
                  onChange={() => {}}
              />
              <InputField
                  label="Fee Duration"
                  isTransulent={false}
                  value={''}
                  onChange={() => {}}
              />
            </div>
          </div>

          <div className="bg-[#EAEAEAB3] px-6 py-2 rounded-sm">
            <div className="flex justify-end gap-3">
              <CustomUnderlinedButton
                text="Edit"
                textColor="text-gray-500"
                onClick={() => setIsFeeStructureDialogOpen(true)}
                icon={<IconUpload size={10} />}
                showIcon={false}
              />
              <CustomUnderlinedButton
                text="Send Reminder"
                textColor="text-gray-500"
                onClick={() => {}}
                icon={<IconUpload size={10} />}
                showIcon={false}
              />
              <CustomUnderlinedButton
                text="Delete"
                textColor="text-gray-500"
                onClick={() => setIsConfirmDeleteFeeStructureDialogOpen(true)}
                icon={<IconUpload size={10} />}
                showIcon={false}
              />
            </div>
            <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2">
              <InputField
                  label="Fee Title"
                  isTransulent={false}
                  value={''}
                  onChange={() => {}}
              />
              <InputField
                  label="Fee Duration"
                  isTransulent={false}
                  value={''}
                  onChange={() => {}}
              />
            </div>
          </div>
        </div>
        <NoAvailableEmptyState message="No fee structure available, click ‘Add New’ to create one." />
      </div>

      <div className="mt-8">
        <GradingSystemTable />
        <NoAvailableEmptyState message="No grade available, click ‘Add New’ to create one." />
      </div>

      <div className="mt-8">
        <h1 className="text-md font-semibold text-neutral-800">Admission Policies</h1>
        <CustomUnderlinedButton
          text="Upload Document"
          textColor="text-purple-500"
          onClick={() => {}}
          icon={<IconUpload size={10} />}
          showIcon={true}
        />
        <section className="flex flex-wrap gap-5 items-center text-base tracking-normal text-gray-800 mt-2">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              name={doc.name}
              width={doc.width}
              onClose={() => {console.log("clicked");}}
            />
          ))}
        </section>
      </div>


      <div className="mt-8">
        <h1 className="text-md font-semibold text-neutral-800">School Logo</h1>

        <CustomUnderlinedButton
          text="Upload Logo"
          textColor="text-purple-500"
          onClick={() => {}}
          icon={<IconUpload size={10} />}
          showIcon={true}
        />

        <section className="flex flex-wrap gap-5 items-center text-base tracking-normal text-gray-800 mt-3">
          <div className="flex flex-col w-auto">
            <SchoolCard
              key="school-1"
              logoUrl="https://cdn.builder.io/api/v1/image/assets/TEMP/f33b143daa0a988b8358b2dd952c60f8aadfc974?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab"
              backgroundColor="bg-[#FFF]"
            />
            <div className="flex justify-between mt-3">
              <CustomUnderlinedButton
                text="Delete Logo"
                textColor="text-gray-500"
                onClick={() => {}}
                showIcon={true}
              />
              <CustomUnderlinedButton
                text="Change Logo"
                textColor="text-gray-500"
                onClick={() => {}}
                showIcon={true}
              />
            </div>
          </div>
        </section>
      </div>


      {/* Fee structure dialog */}
      <Dialog 
        isOpen={isFeeStructureDialogOpen}
        dialogTitle="Add New Fee Structure"
        saveButtonText="Save Changes"
        onClose={() => setIsFeeStructureDialogOpen(false)} 
        onSave={() => {}}
        busy={false}
      >
        <p className="text-xs text-gray-500">Enter the fee details to update the fee structure</p>
        <div className="my-3 flex flex-col gap-4">
          <InputField
            className="!py-0"
            placeholder="Enter Title"
            label="Fee Title"
            value={''}
            onChange={() => {}}
            isTransulent={false}
          />
            
          <Select
            label="Fee Duration"
            placeholder="Please Select"
            data={roles}
            value={selectedDataRole}
            onChange={() => handleRoleDataChange}
          />

          <Select
            label="Fee Duration"
            placeholder="Please Select"
            data={roles}
            value={selectedDataRole}
            onChange={() => handleRoleDataChange}
          />

          <Select
            label="Apply Fees to"
            placeholder="Please Select"
            data={roles}
            value={selectedDataRole}
            onChange={() => handleRoleDataChange}
          />

          <MultiSelect
            label="Class / Level"
            placeholder="Please Select"
            data={permissions}
            value={selectedPermissions}
            onChange={handlePermissionChange}
            withCheckIcon
          />
        </div>
      </Dialog>

      {/* Confirm Delete Fee Structure Dialog */}
      <Dialog 
        isOpen={isConfirmDeleteFeeStructureDialogOpen}
        busy={false}
        dialogTitle="Confirm Delete"
        saveButtonText="Delete Fee"
        onClose={() => setIsConfirmDeleteFeeStructureDialogOpen(false)} 
        onSave={() => {}}
      >
        <div className="my-3 flex flex-col gap-4">
          <p>
          Are you sure you want to delete this fee structure? You will loose all related information
          </p>
        </div>
      </Dialog>
    </div>
  );
};
 