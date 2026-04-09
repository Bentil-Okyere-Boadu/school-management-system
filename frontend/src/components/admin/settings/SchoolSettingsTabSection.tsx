"use client";
import { IconUpload } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import NoAvailableEmptyState from "../../common/NoAvailableEmptyState";
import CustomUnderlinedButton from "../../common/CustomUnderlinedButton";
import InputField from "@/components/InputField";
import { GradingSystemTable } from "./GradingSystemTable";
import { GradingPercentagesSection } from "./GradingPercentagesSection";
import SchoolCard from "@/components/common/SchoolCard";
import { Dialog } from "@/components/common/Dialog";
import {
  MultiSelect,
  NativeSelect,
  NumberInput,
  Select,
  Switch,
  TextInput,
} from "@mantine/core";
import { useDeleteFeeStructure, useDeleteSchoolLogo, useEditFeeStructure, useGetFeeStructure, useSaveFeeStructure, useUpdateCalendlyUrl, useUploadSchoolLogoFile } from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { ClassLevel, ErrorResponse, FeeStructure, School } from "@/@types";
import { EmailItem } from "./EmailItem";
import FileUploadArea from "@/components/common/FileUploadArea";
import { useQueryClient } from "@tanstack/react-query";
import { AdmissionPoliciesSection } from "./AdmissionPoliesSection";
import Link from "next/link";

/** Multi-select sentinel: empty `classLevelIds` on the API means all classes. */
const ALL_CLASSES_VALUE = "__all_classes__";

interface SchoolSettingsTabSectionProps {
  schoolData: School;
  classes: ClassLevel[]
}


export const SchoolSettingsTabSection: React.FC<SchoolSettingsTabSectionProps> = ({schoolData, classes}) => {
  const [isFeeStructureDialogOpen, setIsFeeStructureDialogOpen] =
    useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>("daily");
  const [feesTitle, setFeesTitle] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('')
  const [allowUssdPayment, setAllowUssdPayment] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([
    ALL_CLASSES_VALUE,
  ]);
  const [
    isConfirmDeleteFeeStructureDialogOpen,
    setIsConfirmDeleteFeeStructureDialogOpen,
  ] = useState(false);
  const [feeId, setFeeId] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [isSendReminderDialogOpen, setIsSendReminderDialogOpen] = useState(false);
  const [isSchoolLogoUploadOpen, setIsSchoolLogoUploadOpen] = useState(false);
  const [selectedSchoolLogoFiles, setSelectedSchoolLogoFiles] = useState<File[]>([]);
  const [isConfirmDeleteSchoolLogoDialogOpen, setIsConfirmDeleteSchoolLogoDialogOpen] = useState(false);
  const [classLevels, setClassLevels] = useState<{value: string, label: string}[]>();
  const [emailList, setEmailList] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [calendlyUrl, setCalendlyUrl] = useState(schoolData?.calendlyUrl || '');
  const [calendlyDialogOpen, setCalendlyDialogOpen] = useState(false);


  const duration = [
    { value: "daily", label: "Daily" },
    { value: "monthly", label: "Monthly" },
    { value: "term", label: "Per term" },
    { value: "yearly", label: "Yearly" },
  ];

  useEffect(() => {
    setClassLevels([
      { value: ALL_CLASSES_VALUE, label: "All classes" },
      ...classes.map((classlvl) => ({
        value: classlvl.id,
        label: classlvl.name,
      })),
    ]);
  }, [classes]);
  
  const currencies = [
    { value: "ghc", label: " GHC" },
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
          textAlign: 'center',
        }
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

  const classLevelIdsForApi = (): string[] => {
    if (selectedClasses.includes(ALL_CLASSES_VALUE)) {
      return [];
    }
    return selectedClasses;
  };

  const setAmountSafe = (value: number | string) => {
    if (value === "" || value === undefined) {
      setAmount(0);
      return;
    }
    const n = typeof value === "number" ? value : parseFloat(String(value));
    setAmount(Number.isFinite(n) ? n : 0);
  };

  const addNewFeeStructure = () => {
    if (selectedClasses.length === 0) {
      toast.error("Select at least one class level, or All classes.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount greater than 0.");
      return;
    }
    createFeeStructure({
      feeTitle: feesTitle,
     feeType: selectedDuration,
     amount: amount,
     dueDate: dueDate,
     allowUssdPayment,
     classLevelIds: classLevelIdsForApi(),
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
    if (selectedClasses.length === 0) {
      toast.error("Select at least one class level, or All classes.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount greater than 0.");
      return;
    }
    editMutation({
      feeTitle: feesTitle,
     feeType: selectedDuration,
     amount: amount,
     dueDate: dueDate,
     allowUssdPayment,
     classLevelIds: classLevelIdsForApi(),
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
    setAmount(
      typeof fee.amount === "number" && Number.isFinite(fee.amount)
        ? fee.amount
        : parseFloat(String(fee.amount)) || 0,
    );
    setDueDate(fee.dueDate);
    setFeesTitle(fee.feeTitle);
    setSelectedClasses(
      !fee.classLevelIds || fee.classLevelIds.length === 0
        ? [ALL_CLASSES_VALUE]
        : fee.classLevelIds,
    );
    setSelectedDuration(fee.feeType);
    setAllowUssdPayment(fee.allowUssdPayment !== false);
    setIsFeeStructureDialogOpen(true);
  }

  const clearDialog = () => {
      setDueDate('');
      setFeesTitle('');
      setAmount(0);
      setAllowUssdPayment(true);
      setSelectedClasses([ALL_CLASSES_VALUE]);
      setEditMode(false);
  }

  const handleDurationChange = (value: string | null) => {
    setSelectedDuration(value as string);
  };

  const handleClassesChange = (value: string[]) => {
    const hadAll = selectedClasses.includes(ALL_CLASSES_VALUE);
    const hasAll = value.includes(ALL_CLASSES_VALUE);
    if (hasAll && !hadAll) {
      setSelectedClasses([ALL_CLASSES_VALUE]);
      return;
    }
    if (hasAll && hadAll && value.length > 1) {
      setSelectedClasses(value.filter((v) => v !== ALL_CLASSES_VALUE));
      return;
    }
    setSelectedClasses(value);
  };

  const { mutate: uploadSchoolLogoFileMutate, isPending: isSchoolLogoUploadPending } = useUploadSchoolLogoFile();
  const queryClient = useQueryClient();
  
  const handleSchoolLogoFileSelect = (files: File[]) => {
    setSelectedSchoolLogoFiles(files);
  };

  const handleSchoolLogoUpload = () => {
    if (selectedSchoolLogoFiles?.length > 0) {
      uploadSchoolLogoFileMutate(selectedSchoolLogoFiles[0], {
        onSuccess: () => {
          toast.success('File uploaded successfully');
          setIsSchoolLogoUploadOpen(false);
          queryClient.invalidateQueries({ queryKey: ['mySchool']});
        },
        onError: (error: unknown) => {
          toast.error(
            JSON.stringify((error as ErrorResponse)?.response?.data?.message)
          );
        }
      });
    }
  };

  const { mutate: deleteSchoolLogoMutation, isPending: pendingSchoolLogoDelete } = useDeleteSchoolLogo();

  const deleteSchoolLogo = () => {
    deleteSchoolLogoMutation(null as unknown as void, {
      onSuccess: () => {
        toast.success('Deleted successfully.');
        setIsConfirmDeleteSchoolLogoDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['mySchool']});
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddEmail = () => {
    if (isValidEmail(newEmail)) {
      setEmailList((prev) => [...prev, newEmail]);
      setNewEmail("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailList((prev) => prev.filter((email) => email !== emailToRemove));
  };

  const { mutate: updateCalendlyUrlMutation } = useUpdateCalendlyUrl();

  const handleUpdateCalendlyUrl = () => {
    updateCalendlyUrlMutation({calendlyUrl: calendlyUrl, schoolId: schoolData.id}, {
      onSuccess: () => {
        toast.success('Updated successfully.');
        setCalendlyDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['mySchool']});
      },
      onError: (error: unknown) => {    
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      } 
    })
   }

  return (
    <div className="pb-16">

      <div className="mt-8">
        <div className="flex items-center gap-2">
          <h1 className="text-md font-semibold text-neutral-800">
            Fee Structure
          </h1>
          <CustomUnderlinedButton
            text="Add New"
            textColor="text-purple-500"
            onClick={() => {
              clearDialog();
              setIsFeeStructureDialogOpen(true);
            }}
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
        <GradingPercentagesSection schoolData={schoolData} />
      </div>

      <div className="mt-8">
        <AdmissionPoliciesSection />
      </div>

      <div className="mt-8">
        <h1 className="text-md font-semibold text-neutral-800">School Logo</h1>

        {!schoolData?.logoUrl &&
          <CustomUnderlinedButton
            text="Upload Logo"
            textColor="text-purple-500"
            onClick={() => {setIsSchoolLogoUploadOpen(true)}}
            icon={<IconUpload size={10} />}
            showIcon={true}
          />
        }

        {schoolData?.logoUrl && (
          <section className="flex flex-wrap gap-5 items-center text-base tracking-normal text-gray-800 mt-3">
            <div className="flex flex-col w-auto">
              <SchoolCard
                key="school-1"
                logoUrl={schoolData?.logoUrl}
                backgroundColor="bg-[#FFF]"
              />
              <div className="flex justify-between mt-3">
                <CustomUnderlinedButton
                  text="Delete Logo"
                  textColor="text-gray-500"
                  onClick={() => {setIsConfirmDeleteSchoolLogoDialogOpen(true)}}
                  showIcon={true}
                />
                <CustomUnderlinedButton
                  text="Change Logo"
                  textColor="text-gray-500"
                  onClick={() => {setIsSchoolLogoUploadOpen(true)}}
                  showIcon={true}
                />
              </div>
            </div>
          </section>
          )
        }
      </div>
      
      <div className="mt-8 w-1/4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-neutral-800">Calendly URL</label>
          <CustomUnderlinedButton
            text="Edit URL"
            textColor="text-gray-500"
            onClick={() => {
              setCalendlyDialogOpen(true);
              setCalendlyUrl(schoolData?.calendlyUrl);
            }}
            showIcon={true}
          />
        </div>

        <Link href={schoolData?.calendlyUrl || ''} target="_blank" className="text-sm text-purple-600 underline mb-2 inline-block">
          {schoolData?.calendlyUrl || ''}
        </Link>
        
      </div>

      <Dialog
        isOpen={calendlyDialogOpen}
        dialogTitle="Enter Calendly URL"
        saveButtonText="Save Changes"
        onClose={() => {
          setCalendlyDialogOpen(false);
          setCalendlyUrl('');
        }}
        onSave={handleUpdateCalendlyUrl}
        busy={isLoading} 
        >
          <InputField
          className="!py-0"
          value={calendlyUrl}
          onChange={(e) => setCalendlyUrl(e.target.value)}
        />
      </Dialog>

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

          <MultiSelect
            label="Fee Applies to"
            placeholder="All classes or specific class levels"
            data={classLevels ?? []}
            value={selectedClasses}
            onChange={handleClassesChange}
            withCheckIcon
          />

          <Switch
            label="Payable via USSD"
            description="If off, this fee will not be included in mobile or USSD payments."
            checked={allowUssdPayment}
            onChange={(e) => setAllowUssdPayment(e.currentTarget.checked)}
          />

          <NumberInput
            label="Amount"
            placeholder="0.00"
            min={0}
            allowDecimal
            decimalScale={2}
            fixedDecimalScale={false}
            hideControls
            clampBehavior="strict"
            value={Number.isFinite(amount) ? amount : 0}
            onChange={setAmountSafe}
            leftSection={select}
            leftSectionWidth={90}
            styles={{
              section: {
                justifyContent: "flex-start",
              },
            }}
          />

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
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            rightButton={
              <button
                type="button"
                  className={`h-8 cursor-pointer text-sm font-semibold rounded-md border bg-opacity-10 w-[98px]
                    ${isValidEmail(newEmail)
                      ? "border-[#AB58E7] text-[#AB58E7]"
                      : "bg-[#ebebeb] border-zinc-400 text-zinc-500"
                    }`}
                  onClick={handleAddEmail}
                  disabled={!isValidEmail(newEmail)}
                >
                Add email
              </button>
            }
          />
          {emailList?.map((email, index) => (
            <EmailItem
              key={index}
              email={email}
              onIconClick={() => handleRemoveEmail(email)}
            />
          ))}
          
          <Select
            label="Send via"
            className="mb-8"
            placeholder="Please Select"
            data={[{label:'Email', value:'email'}]}
            value={'email'}
            onChange={() => {}}
          />
        </div>
      </Dialog>

        {/* School Logo Upload Dialog */}
        <Dialog 
          isOpen={isSchoolLogoUploadOpen}
          busy={isSchoolLogoUploadPending}
          dialogTitle="School Logo Upload"
          saveButtonText="Upload"
          onClose={() => {setIsSchoolLogoUploadOpen(false)}} 
          onSave={() => {handleSchoolLogoUpload()}}
        >
          <div className="flex flex-col gap-4 my-5">
            <FileUploadArea onFileSelect={handleSchoolLogoFileSelect} accept="image/*" />
            {selectedSchoolLogoFiles?.length > 0 && (
              <div className="text-sm text-gray-700">
                Selected: <strong>{selectedSchoolLogoFiles?.map(f => f.name).join(', ')}</strong>
              </div>
            )}
          </div>
        </Dialog>

        {/* Confirm Delete School logo Dialog */}
        <Dialog 
          isOpen={isConfirmDeleteSchoolLogoDialogOpen}
          busy={pendingSchoolLogoDelete}
          dialogTitle="Confirm Delete"
          saveButtonText="Delete Logo"
          onClose={() => { setIsConfirmDeleteSchoolLogoDialogOpen(false)}} 
          onSave={deleteSchoolLogo}
        >
          <div className="my-3 flex flex-col gap-4">
            <p className="mt-3 mb-6">
              Are you sure you want to delete this school logo? 
            </p>
          </div>
        </Dialog>
    </div>
  );
};
