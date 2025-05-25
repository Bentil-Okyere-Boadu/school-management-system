"use client";
// import CustomButton from "@/components/Button";
import { IconUpload } from "@tabler/icons-react";
import React, { useState } from "react";
import NoAvailableEmptyState from "../../common/NoAvailableEmptyState";
import CustomUnderlinedButton from "../../common/CustomUnderlinedButton";
import InputField from "@/components/InputField";
import { GradingSystemTable } from "./GradingSystemTable";
import SchoolCard from "@/components/common/SchoolCard";
// import DocumentItem from "@/components/common/DocumentItem";
import { Dialog } from "@/components/common/Dialog";
import { MultiSelect, NativeSelect, Select, TextInput } from "@mantine/core";
import { useDeleteFeeStructure, useEditFeeStructure, useGetFeeStructure, useSaveFeeStructure } from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { ErrorResponse, FeeStructure } from "@/@types";
import { EmailItem } from "./EmailItem";
// import { FeeStructureTable } from "./FeeStructureTable";
// import { GradingSystemTable } from "./GradingSystemTable";

export const SchoolSettingsTabSection: React.FC = () => {
  const [isFeeStructureDialogOpen, setIsFeeStructureDialogOpen] =
    useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>("daily");
  const [feesAppliesTo, setFeesAppliesTo] = useState<string>("new");
  const [feesTitle, setFeesTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState('')
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["class-1"]);
  const [
    isConfirmDeleteFeeStructureDialogOpen,
    setIsConfirmDeleteFeeStructureDialogOpen,
  ] = useState(false);
    const [feeId, setFeeId] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [isSendReminderDialogOpen, setIsSendReminderDialogOpen] = useState(false);


  const appliesTo = [
    { value: "new", label: "New Students" },
    { value: "continuing", label: "Continuing Students" },
  ];
  const duration = [
    { value: "daily", label: "Daily" },
    { value: "monthly", label: "Monthly" },
    { value: "term", label: "Per term" },
    { value: "yearly", label: "Yearly" },
  ];
  const classes = [
    { value: "class-1", label: "Class 1" },
    { value: "class-2", label: "Class 2" },
    { value: "class-3", label: "Class 3" },
    { value: "class-4", label: "Class 4" },
  ];

  const currencies = [
    { value: "ghc", label: "GHC" },
    { value: "eur", label: "🇪🇺 EUR" },
    { value: "usd", label: "🇺🇸 USD" },
    { value: "cad", label: "🇨🇦 CAD" },
    { value: "gbp", label: "🇬🇧 GBP" },
    { value: "aud", label: "🇦🇺 AUD" },
  ];

  const select = (
    <NativeSelect
      data={currencies}
      rightSectionWidth={15}
      styles={{
        input: {
          fontWeight: 500,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          width: 80,
        },
      }}
    />
  );

  const { mutate: createFeeStructure } = useSaveFeeStructure();
  const { feesStructure, isLoading, refetch } = useGetFeeStructure();
  const {mutate: deleteMutation } = useDeleteFeeStructure();
  const { mutate: editMutation } = useEditFeeStructure(feeId);

  const deleteFeeStructure = () => {
    deleteMutation(feeId, {
      onSuccess: () => {
        setFeeId('');
        toast.success('Deleted successfully');
        setIsConfirmDeleteFeeStructureDialogOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const onDeleteFeeStructureClick = (id: string) => {
    setFeeId(id);
    setIsConfirmDeleteFeeStructureDialogOpen(true);
  }

  const addNewFeeStructure = () => {
    createFeeStructure({
      feeTitle: feesTitle,
     feeType: selectedDuration,
     amount: amount,
     appliesTo: feesAppliesTo,
     dueDate: dueDate,
    }, {
      onSuccess: () => {
        toast.success('Saved successfully.');
        setIsFeeStructureDialogOpen(false);
        clearDialog()
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const editFeeStructure = () => {
    editMutation({
      feeTitle: feesTitle,
     feeType: selectedDuration,
     amount: amount,
     appliesTo: feesAppliesTo,
     dueDate: dueDate,
    }, {
      onSuccess: () => {
        toast.success('Saved successfully.');
        setIsFeeStructureDialogOpen(false);
        clearDialog()
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const onEditFeeStructureClick = (fee: FeeStructure) => {
    setFeeId(fee.id || "");
    setEditMode(true);
    setAmount(fee.amount);
    setDueDate(fee.dueDate);
    setFeesTitle(fee.feeTitle);
    setFeesAppliesTo(fee.appliesTo);
    setSelectedClasses(fee.classes);
    setSelectedDuration(fee.feeType);
    setIsFeeStructureDialogOpen(true);
  }

  const clearDialog = () => {
     setFeesAppliesTo('');
      setFeesAppliesTo('');
      setDueDate('');
      setFeesTitle('');
      setSelectedClasses([]);
  }

  const handleDurationChange = (value: string | null) => {
    setSelectedDuration(value as string);
  };

  const handleAppliesToChange = (value: string | null) => {
    setFeesAppliesTo(value as string);
  };

  const handleClassesChange = (value: string[]) => {
    setSelectedClasses(value);
  };

  return (
    <div className="pb-16">
      {/* <div className="flex justify-end">
        <CustomButton text="Save Changes" onClick={() => {}} />
      </div> */}

      <div className="mt-8">
        <div className="flex items-center gap-2">
          <h1 className="text-md font-semibold text-neutral-800">
            Fee Structure
          </h1>
          <CustomUnderlinedButton
            text="Add New"
            textColor="text-purple-500"
            onClick={() => setIsFeeStructureDialogOpen(true)}
            showIcon={false}
          />
        </div>
        <div className="flex flex-col gap-4 mb-12">
          {
            feesStructure.length > 0? feesStructure?.map((feeStructure, index) => {
              return (
                <div key={index} className="bg-[#EAEAEAB3] px-6 py-2 rounded-sm">
                  <div className="flex justify-end gap-3">
                    <CustomUnderlinedButton
                      text="Edit"
                      textColor="text-gray-500"
                      onClick={() => onEditFeeStructureClick(feeStructure) }
                      showIcon={false}
                    />
                    <CustomUnderlinedButton
                      text="Send Reminder"
                      textColor="text-gray-500"
                      onClick={() => {}}
                      showIcon={false}
                    />
                    <CustomUnderlinedButton
                      text="Delete"
                      textColor="text-gray-500"
                      onClick={() =>
                        onDeleteFeeStructureClick(feeStructure.id || "")
                      }
                      showIcon={false}
                    />
                  </div>
                  <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2">
                    <InputField
                      label="Fee Title"
                      isTransulent={false}
                      value={feeStructure.feeTitle}
                      readOnly={true}
                    />
                    <InputField
                      label="Fee Duration"
                      isTransulent={false}
                      value={feeStructure.feeType}
                      readOnly={true}
                    />
                  </div>
                </div>
              );
            }) : (
              <NoAvailableEmptyState message="No fee structure available, click ‘Add New’ to create one." />
            )
          }
        </div>
      </div>

      <div className="mt-8">
        <GradingSystemTable />
      </div>

      <div className="mt-8">
        <h1 className="text-md font-semibold text-neutral-800">
          Admission Policies
        </h1>
        <CustomUnderlinedButton
          text="Upload Document"
          textColor="text-purple-500"
          onClick={() => {}}
          icon={<IconUpload size={10} />}
          showIcon={true}
        />
        <section className="flex flex-wrap gap-5 items-center text-base tracking-normal text-gray-800 mt-2">
          {/* {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              name={doc.name}
              width={doc.width}
              onClose={() => {
                console.log("clicked");
              }}
            />
          ))} */}
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
        onClose={() => {
          clearDialog();
          setIsFeeStructureDialogOpen(false);
        }}
        onSave={editMode? editFeeStructure : addNewFeeStructure}
        busy={isLoading}
      >
        <p className="text-xs text-gray-500">
          Enter the fee details to update the fee structure
        </p>
        <div className="my-3 flex flex-col gap-4">
          <InputField
            className="!py-0"
            placeholder="Enter Title"
            label="Fee Title"
            value={feesTitle}
            onChange={(e) => { setFeesTitle(e.target.value)}}
            isTransulent={false}
          />

          <Select
            label="Fee Duration"
            placeholder="Please Select"
            data={duration}
            value={selectedDuration}
            onChange={handleDurationChange}
          />

          <Select
            label="Apply Fees to"
            placeholder="Please Select"
            data={appliesTo}
            value={feesAppliesTo}
            onChange={handleAppliesToChange}
          />

          <MultiSelect
            label="Class / Level"
            placeholder="Please Select"
            data={classes}
            value={selectedClasses}
            onChange={handleClassesChange}
            withCheckIcon
          />

          <TextInput
            type="number"
            label="Amount"
            leftSection={select}
            leftSectionWidth={90}
            value={amount}
            onChange={(e) => { setAmount(Number(e.target.value)) }}
          />

          {/* <InputField
            className="!py-0"
            placeholder=""
            label="Amount"
            value={''}
            type="number"
            onChange={() => {}}
            isTransulent={false}
          /> */}

          <InputField
            className="!py-0"
            placeholder="Enter Date"
            label="Due Date"
            value={dueDate}
            type="date"
            onChange={(e) => { setDueDate(e.target.value)}}
            isTransulent={false}
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
        onSave={deleteFeeStructure}
      >
        <div className="my-3 flex flex-col gap-4">
          <p>
            Are you sure you want to delete this fee structure? You will loose
            all related information
          </p>
        </div>
      </Dialog>

      {/* Send Reminder dialog */}
      <Dialog
        isOpen={isSendReminderDialogOpen}
        dialogTitle="Send Reminder"
        saveButtonText="Send"
        onClose={() => {
          setIsSendReminderDialogOpen(false);
        }}
        onSave={() => {}}
        busy={false}
      >
        <p className="text-xs text-gray-500">
          Enter emails to send fee reminders
        </p>
        <div className="my-3 flex flex-col gap-2">
          <InputField
            label="Emails"
            type="text"
            rightButton={
              <button type="button" className={`h-8 cursor-pointer text-sm font-semibold rounded-md border  bg-opacity-10  w-[98px]
                ${false ? "border-[#AB58E7] text-[#AB58E7]" : "bg-[#ebebeb] border-zinc-400 text-zinc-500"}`} 
                onClick={() => {}}>
                Add email
              </button>
            }
          />
          {["mike@gmsdf", "ab@gmai.com"].map((email, index) => (
            <EmailItem
              key={index}
              email={email}
              onIconClick={() => {
                console.log("clicked");
              }}
            />
          ))}
          
          <Select
            label="Send via"
            className="mb-8"
            placeholder="Please Select"
            data={['Email', 'SMS']}
            value={''}
            onChange={() => {}}
          />
        </div>
      </Dialog>
    </div>
  );
};
