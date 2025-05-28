"use client";
import React, { useEffect, useState } from "react";
import InputField from "@/components/InputField";
import ProfileCard from "@/components/common/ProfileCard";
import CustomUnderlinedButton from "../CustomUnderlinedButton";
import NoProfileImg from '@/images/no-profile-img.png' 
import CustomButton from "@/components/Button";
import { useEditSchoolAdminInfo, useUploadProfileImage, useDeleteProfileImage } from "@/hooks/school-admin";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ErrorResponse } from "@/@types";
import { Dialog } from "@/components/common/Dialog";
import FileUploadArea from "@/components/common/FileUploadArea";;

interface ProfileTabSectionProps {
  schoolAdminInfo: {
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    id: string;
    role: {
      label: string;
    }
    profile: {    
      address: string;
      phoneContact: string;
      streetAddress: string;
      optionalPhoneContact: string;
      avatarUrl: string;
    }
  };
}

export const ProfileTabSection: React.FC<ProfileTabSectionProps> = ({ schoolAdminInfo }) => {

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [address, setAddress] = useState("");
  const [phoneContact, setPhoneContact] = useState("");
  const [optionalPhoneContact, setOptionalPhoneContact] = useState("");
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isConfirmDeleteProfileImageDialogOpen, setIsConfirmDeleteProfileImageDialogOpen] = useState(false);

  const prepopulateProfileSettings = () => {
    setFirstName(schoolAdminInfo?.firstName);
    setLastName(schoolAdminInfo?.lastName);
    setRole(schoolAdminInfo?.role?.label)
    setEmail(schoolAdminInfo?.email);
    setStreetAddress(schoolAdminInfo?.profile?.streetAddress);
    setAddress(schoolAdminInfo?.profile?.address);
    setPhoneContact(schoolAdminInfo?.profile?.phoneContact);
    setOptionalPhoneContact(schoolAdminInfo?.profile?.optionalPhoneContact);  
  }

  useEffect(() => {
    prepopulateProfileSettings()
  }, [])

  const queryClient = useQueryClient();
  
  const { mutate: editMutation, isPending } = useEditSchoolAdminInfo();


  const editSchoolAdminInfo = () => {
    if(firstName && lastName && email) {
      editMutation({
        firstName: firstName,
        lastName: lastName,
        email: email,
        phoneContact: phoneContact,
        address: address,
        streetAddress: streetAddress,
        optionalPhoneContact: optionalPhoneContact,
      }, {
        onSuccess: () => {
          toast.success('Saved successfully.');
          queryClient.invalidateQueries({ queryKey: ['schoolAdminMe']})
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        }
      })
    } else {
        toast.error('Some fields can not be left empty');
      }
  }

  const { mutate: uploadFileMutate, isPending: isUploadPending } = useUploadProfileImage(schoolAdminInfo?.id);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    if (selectedFiles?.length > 0) {
      uploadFileMutate(selectedFiles[0], {
        onSuccess: () => {
          toast.success('File uploaded successfully');
          setIsFileUploadOpen(false);
          queryClient.invalidateQueries({ queryKey: ['schoolAdminMe']});
          queryClient.invalidateQueries({ queryKey: ['schoolAdminInfo']});
        },
        onError: (error: unknown) => {
          toast.error(
            JSON.stringify((error as ErrorResponse)?.response?.data?.message)
          );
        }
      });
    }
  };

  const { mutate: deleteProfileImageMutation, isPending: pendingProfileImageDelete } = useDeleteProfileImage();

  const deleteProfileImage = () => {
      deleteProfileImageMutation(schoolAdminInfo?.id, {
          onSuccess: () => {
            toast.success('Deleted successfully.');
            setIsConfirmDeleteProfileImageDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['schoolAdminMe']});
            queryClient.invalidateQueries({ queryKey: ['schoolAdminInfo']});
          },
          onError: (error: unknown) => {
              toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
          }
      })
  }
  
  const onDeleteProfileImageClick = () => {
    setIsConfirmDeleteProfileImageDialogOpen(true);
  }

  return (
    <div className="pb-8">
        <div className="flex justify-end">
            <CustomButton text="Save Changes" loading={isPending} onClick={() => editSchoolAdminInfo()} />
        </div>

        <h1 className="text-md font-semibold text-neutral-800 mb-2">My Profile</h1>
        <section className="flex flex-wrap gap-5 items-center text-base tracking-normal text-gray-800 mt-3">
          <div className="flex flex-col w-auto">
            <ProfileCard
              key="profile-admin-1"
              logoUrl={schoolAdminInfo?.profile?.avatarUrl || NoProfileImg.src}
              backgroundColor="bg-[#FFF]"
            />

            <div className="flex justify-center gap-6 mt-3">
              <CustomUnderlinedButton
                text="Change Image"
                textColor="text-gray-500"
                onClick={() => {setIsFileUploadOpen(true)}}
                showIcon={true}
              />
              <CustomUnderlinedButton
                text="Delete"
                textColor="text-gray-500"
                onClick={() => {onDeleteProfileImageClick()}}
                showIcon={true}
              />
            </div>
          </div>
        </section>

        <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 mt-10">
            <InputField
                label="First Name"
                isTransulent={false}
                value={firstName}
                onChange={(e) => {setFirstName(e.target.value)}}
            />
            <InputField
                label="Last Name"
                isTransulent={false}
                value={lastName}
                onChange={(e) => {setLastName(e.target.value)}}
            />
            <InputField
                label="Postition at School"
                isTransulent={true}
                value={role}
                onChange={(e) => {setRole(e.target.value)}}
            />
            <InputField
                label="Email"
                isTransulent={false}
                value={email}
                onChange={(e) => {setEmail(e.target.value)}}
            />
            <InputField
                label="Street Address"
                isTransulent={false}
                value={streetAddress}
                onChange={(e) => {setStreetAddress(e.target.value)}}
            />
            <InputField
                label="Box Address"
                isTransulent={false}
                value={address}
                onChange={(e) => {setAddress(e.target.value)}}
            />
            <InputField
                label="Phone"
                isTransulent={false}
                value={phoneContact}
                onChange={(e) => {setPhoneContact(e.target.value)}}
            />
            <InputField
                label="Phone(optional)"
                isTransulent={false}
                value={optionalPhoneContact}
                onChange={(e) => {setOptionalPhoneContact(e.target.value)}}
            />
        </div>

        {/* Confirm Upload Profile Dialog */}
        <Dialog 
          isOpen={isFileUploadOpen}
          busy={isUploadPending}
          dialogTitle="File Upload"
          saveButtonText="Upload"
          onClose={() => {setIsFileUploadOpen(false)}} 
          onSave={() => {handleUpload()}}
        >
          <div className="flex flex-col gap-4 my-5">
            <FileUploadArea onFileSelect={handleFileSelect} accept="image/*" />
            {selectedFiles.length > 0 && (
              <div className="text-sm text-gray-700">
                Selected: <strong>{selectedFiles.map(f => f.name).join(', ')}</strong>
              </div>
            )}
          </div>
        </Dialog>

        {/* Confirm Delete Profile Dialog */}
        <Dialog 
          isOpen={isConfirmDeleteProfileImageDialogOpen}
          busy={pendingProfileImageDelete}
          dialogTitle="Confirm Delete"
          saveButtonText="Delete Image"
          onClose={() => { setIsConfirmDeleteProfileImageDialogOpen(false)}} 
          onSave={deleteProfileImage}
        >
          <div className="my-3 flex flex-col gap-4">
            <p className="mt-3 mb-6">
              Are you sure you want to delete this profile Image? 
            </p>
          </div>
        </Dialog>
    </div>
  );
};
 