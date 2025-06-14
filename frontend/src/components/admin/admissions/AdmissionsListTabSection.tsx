"use client";

import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import FilterButton from "@/components/common/FilterButton";
import { CustomSelectTag, OptionItem } from "@/components/common/CustomSelectTag";
import { AdmissionStatus, AdmissionTableData, ErrorResponse } from "@/@types";
import { AdmissionStatusMenu } from "./AdmissionStatusMenu";
import { Menu } from "@mantine/core";
import { IconDots, IconEyeFilled, IconTrashFilled } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/common/Dialog";
import { useDeleteAdmission, useEditAdmission, useInterviewInvitation } from "@/hooks/school-admin";
import { toast } from "react-toastify";
import InputField from "@/components/InputField";

interface AdmissionsListTabProps {
  handleSearch: (term: string) => void;
  admissionsList: AdmissionTableData[];
  selectedFilterStatus: string;
  handleFilterStatusChange: (status: string) => void;
  refetchAdmissionList: () => void
}


export const AdmissionsListTabSection: React.FC<AdmissionsListTabProps> = ({handleSearch, admissionsList, selectedFilterStatus, handleFilterStatusChange, refetchAdmissionList}) => {
  const router = useRouter();
  const [isConfirmDeleteAdmissionDialogOpen, setIsConfirmDeleteAdmissionDialogOpen] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [admissionId, setAdmissionId] = useState('');
  const [isInterviewInviteDialogOpen, setIsInterviewInviteDialogOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");

  const statusFilterOptions = [
    { value: "", label: "Status" },
    { value: AdmissionStatus.SUBMITTED, label: "Application Submitted" },
    { value: AdmissionStatus.ACCEPTED, label: "Accepted" },
    { value: AdmissionStatus.REJECTED, label: "Rejected" },
    { value: AdmissionStatus.WAITLISTED, label: "Waitlisted" },
    { value: AdmissionStatus.INTERVIEW_PENDING, label: "Interview Pending" },
    { value: AdmissionStatus.INTERVIEW_COMPLETED, label: "Interview Completed" }
  ];

  const onOptionFilterItemClick = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    handleFilterStatusChange(selectedValue);
  };

  const onHandleAdmissionStatusChange = (optionItem: OptionItem, admissionId: string) => {
    setAdmissionId(admissionId);
    const sSelectedStatus = optionItem.value;

    if(sSelectedStatus == "interview-invite") {
      setInterviewTime("");
      setInterviewDate("");
      setIsInterviewInviteDialogOpen(true);
    } else {
      updateAdmissionStatus(sSelectedStatus);
    }
  }

  const { mutate: deleteAdmissionMutation, isPending: pendingAdmissionDelete } = useDeleteAdmission();
  const { mutate: editMutation } = useEditAdmission(admissionId);

  const deleteAdmission = () => {
    deleteAdmissionMutation(admissionId, {
      onSuccess: () => {
        toast.success('Deleted successfully.');
        setIsConfirmDeleteAdmissionDialogOpen(false);
        refetchAdmissionList();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const onDeleteAdmissionClick = (sId: string) => {
    setIsConfirmDeleteAdmissionDialogOpen(true);
    setAdmissionId(sId);
  }

  const updateAdmissionStatus = (sSelectedStatus: string) => {
    editMutation({ status: sSelectedStatus}, {
      onSuccess: () => {
        toast.success('Successfully updated admission status.')
        refetchAdmissionList();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const { mutate: interviewInvite, isPending: isInterviewInvitePending } = useInterviewInvitation(admissionId);

  const sendInterviewInvite = () => {
    if(interviewDate && interviewTime){
      interviewInvite({ interviewDate: interviewDate, interviewTime: interviewTime }, {
        onSuccess: () => {
          toast.success('Interview invitation sent successfully.');
          setInterviewTime("");
          setInterviewDate("");
          setIsInterviewInviteDialogOpen(false);
          refetchAdmissionList();
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        }
      }) 
    } else {
      toast.error('Please enter details of invite details.');
    }
  }

  return (
    <div>
      <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full ml-1" />

      <div className="flex flex-col items-end mb-4 px-1">
        <FilterButton onClick={() => setShowFilterOptions(!showFilterOptions)} />
        {showFilterOptions && (
          <div className="flex gap-3 mt-3">
            <CustomSelectTag value={selectedFilterStatus} options={statusFilterOptions} onOptionItemClick={onOptionFilterItemClick} />
          </div>
        )}
      </div>

      <section className="bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-40 max-w-[240px]">
                  <div>Name</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Email</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Submit Time</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[138px]">
                  <div>Status</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {admissionsList?.length > 0 ? (admissionsList.map((admission, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                    {admission.fullName}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {admission.email}
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    {admission.submittedAt}
                  </td>
                  <td
                    className={`px-6 py-6 leading-none text-center border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5`}
                  >
                    <div className="flex items-center justity-start">
                      <AdmissionStatusMenu 
                        status={admission.enrollmentStatus} 
                        admissionId={admission.id}
                        onStatusClick={(option, admissionId) => onHandleAdmissionStatusChange(option, admissionId)} /> 
                    </div>
                  </td>
                  <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                    <div className="flex items-center justify-end pr-6">
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <IconDots className="cursor-pointer" />
                        </Menu.Target>
                        <Menu.Dropdown className="!-ml-12 !-mt-2">
                          <Menu.Item leftSection={<IconEyeFilled size={18} color="#AB58E7" />}
                            onClick={() => router.push(`/admin/admissions/${admission.id}`)}
                          >
                            Full View
                          </Menu.Item>
                          <Menu.Item leftSection={<IconTrashFilled size={18} color="#AB58E7" /> }
                            onClick={() => onDeleteAdmissionClick(admission.id)}
                          >
                            Delete Admission
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm text-gray-400 mt-1">Once users are added, they will appear in this table.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirm Delete Admission Dialog */}
      <Dialog 
        isOpen={isConfirmDeleteAdmissionDialogOpen}
        busy={pendingAdmissionDelete}
        dialogTitle="Confirm Delete"
        saveButtonText="Delete Admission"
        onClose={() => { setIsConfirmDeleteAdmissionDialogOpen(false)}} 
        onSave={deleteAdmission}
      >
        <div className="my-3 flex flex-col gap-4">
          <p>
            Are you sure you want to delete this admission? You will loose all related information
          </p>
        </div>
      </Dialog>

      {/* Interview Invite dialog */}
      <Dialog 
        isOpen={isInterviewInviteDialogOpen}
        dialogTitle="Send Interview Invite"
        saveButtonText="Submit Invite"
        onClose={() => setIsInterviewInviteDialogOpen(false)} 
        onSave={() => sendInterviewInvite()}
        busy={isInterviewInvitePending}
      >
        <p className="text-xs text-gray-500">User will receive email invite</p>
        <div className="my-3 flex flex-col gap-4">
          <InputField
            className="!py-0"
            label="Interview Date"
            type="date"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            isTransulent={isInterviewInvitePending}
          />

          <InputField
            className="!py-0"
            label="Interview Time"
            type="time"
            value={interviewTime}
            onChange={(e) => setInterviewTime(e.target.value)}
            isTransulent={isInterviewInvitePending}
          />
        </div>
      </Dialog>
    </div>
  );
};
 