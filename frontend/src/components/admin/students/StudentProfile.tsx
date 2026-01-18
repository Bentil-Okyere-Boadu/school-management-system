"use client"

import { useParams } from "next/navigation";
import NoProfileImg from '@/images/no-profile-img.png' 
import React, { useEffect, useState } from "react";
import InputField from "@/components/InputField";
import { Parent, Profile, Student, ErrorResponse } from "@/@types";
import CustomButton from "@/components/Button";
import Guardian from "./Guardian";
import CustomUnderlinedButton from "@/components/common/CustomUnderlinedButton";
import { Dialog } from "@/components/common/Dialog";
import { useCreateGuardian, useDeleteProfileImage, useUpdateStudentProfile, useUploadProfileImage } from "@/hooks/student";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import ProfileCard from "@/components/common/ProfileCard";
import FileUploadArea from "@/components/common/FileUploadArea";
import { Select } from "@mantine/core";

interface StudentProfileProps {
  studentData: Student;
  viewMode: boolean;
  refetch: () => void;
}

const StudentProfile = ({studentData, viewMode, refetch} : StudentProfileProps) => {
  const { id } = useParams();

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];

  const guardianObj: Parent = { 
    firstName: '',
    lastName: '',
    occupation: '',
    email: '',
    address: '',
    phone: '',
    relationship: ''
  }
  const { mutate: createGuardian } = useCreateGuardian(id? id as string : studentData?.id);
  const { mutate: editStudent } = useUpdateStudentProfile();

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newGuardian, setNewGuardian] = useState<Parent>(guardianObj);
  const [student, setStudent] = useState(studentData);
  const [profile, setProfile] = useState<Partial<Profile>>()
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isConfirmDeleteProfileImageDialogOpen, setIsConfirmDeleteProfileImageDialogOpen] = useState(false);

  useEffect(() => {
    setStudent(studentData);
    setProfile({ 
    firstName: studentData?.firstName || "", 
    lastName: studentData?.lastName || "",
    otherName: studentData?.profile?.otherName || "",
    PlaceOfBirth: studentData?.profile?.PlaceOfBirth || "",
    DateOfBirth: studentData?.profile?.DateOfBirth || "",
    gender: studentData?.gender || "",
  })
  }, [studentData]);

  const saveStudentData = () => {
    editStudent( profile as Partial<Profile>, {
      onSuccess: () => {
        toast.success('Student data updated successfully.');
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(
          JSON.stringify((error as ErrorResponse)?.response?.data?.message || 'Error occurred while updating profile.')
        );
      }
    })
  }

  const saveNewGuardian = () => {
    createGuardian(newGuardian as Parent, {
      onSuccess: () => {
        toast.success('Guardian added successfully.')
        refetch();
        setNewGuardian(guardianObj)
        setDialogOpen(false);
      },
      onError: (error: unknown) => {
        toast.error(
          JSON.stringify((error as ErrorResponse)?.response?.data?.message || 'Error occurred while adding guardian.')
        );
      }
    })
  }

  const queryClient = useQueryClient();
  const { mutate: uploadFileMutate, isPending: isUploadPending } = useUploadProfileImage(student?.id);
  
  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    if (selectedFiles?.length > 0) {
      uploadFileMutate(selectedFiles[0], {
        onSuccess: () => {
          toast.success('File uploaded successfully');
          setIsFileUploadOpen(false);
          queryClient.invalidateQueries({ queryKey: ['studentMe']});
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
    deleteProfileImageMutation(student?.id, {
      onSuccess: () => {
        toast.success('Deleted successfully.');
        setIsConfirmDeleteProfileImageDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['studentMe']});
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
    <div>
      <div>
        <div className="flex justify-between flex-row">
          {/* Personal Information */}
          <div className="flex flex-col justify-center">
            <h3 className="font-bold mb-3">Personal Information</h3>
            <section className="flex flex-wrap gap-5 items-center text-base tracking-normal text-gray-800 mt-3">
              <div className="flex flex-col w-auto">
                <ProfileCard
                  key="profile-student-1"
                  logoUrl={student?.profile?.avatarUrl || NoProfileImg.src}
                  backgroundColor="bg-[#FFF]"
                />
                {!id && (
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
                )}
              </div>
            </section>
          </div>
          {id ? (
            <></>
          ) : (
            <div>
              <CustomButton text="Save changes" onClick={saveStudentData} />
            </div>
          )}
        </div>
        {/* Bio Data */}
        <div className="mt-15 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InputField
            className="!py-0"
            label="First Name"
            isTransulent={viewMode}
            value={profile?.firstName}
            onChange={(e) => setProfile({...profile, firstName: e.target.value})}
          />
          <InputField
            className="!py-0"
            label="Last Name"
            value={profile?.lastName}
            isTransulent={viewMode}
            onChange={(e) => setProfile({...profile, lastName: e.target.value})}
          />

          <InputField
            className="!py-0"
            label="Other Names"
            onChange={(e) => setProfile({...profile, otherName: e.target.value})}
            value={profile?.otherName}
            isTransulent={viewMode}
          />
          {/* <InputField className="!py-0" label="Gender" value={student?.gender} isTransulent={true} /> */}
          <Select
            className=""
            label="Gender"
            placeholder="Select gender"
            data={genderOptions}
            value={profile?.gender || student?.gender || ""}
            disabled={viewMode}
            classNames={{
              input: `${viewMode ? "!bg-[#8787871A] !border-none !outline-none" : "!bg-transparent"}`
            }}
            onChange={(value) =>
              setProfile({ ...profile, gender: value ?? "" })
            }
          />
          <InputField
            className="!py-0"
            label="Date of Birth"
            type="Date"
            onChange={(e) => setProfile({...profile, DateOfBirth: e.target.value})}
            value={profile?.DateOfBirth}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Place of Birth"
            value={profile?.PlaceOfBirth}
            isTransulent={viewMode}
            onChange={(e) => setProfile({...profile, PlaceOfBirth: e.target.value})}
          />
          <InputField
            className="!py-0"
            label="Email"
            type="Email"
            isTransulent={true}
            value={student?.email}
            onChange={(e) => setProfile({...profile, email: e.target.value})}
          />
        </div>

        {/* Academic Information */}
        <div className="mt-15">
          <h3 className="font-bold mb-3">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <InputField className="!py-0" label="Grade" value={student?.classLevels[0]?.name} isTransulent={true} />
            <InputField
              className="!py-0"
              label="Student ID"
              value={student?.studentId as string}
              isTransulent={true}
            />
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div className="mt-15 mb-10">
          <div className="flex justify-between items-center">
            <h3 className="font-bold mb-3">Parent/Guardian Information</h3>
            {!id && (<CustomUnderlinedButton
              text="Add New Guardian"
              textColor="text-purple-500"
              onClick={() => setDialogOpen(true)}
              showIcon={false}
            />)}
          </div>
          {student?.parents.map((parent, index) => {
            return <Guardian key={index} parent={parent} viewMode={true} count={index+1} refetchStudentData={refetch}/>
          })}

          <Dialog
            isOpen={dialogOpen}
            dialogTitle="Add Guardian"
            onClose={() => setDialogOpen(false)}
            onSave={saveNewGuardian}
          >
            <div className="flex flex-col mt-3">
              <InputField className="!py-0" label="First Name" value={newGuardian?.firstName} onChange={(e) => setNewGuardian({...newGuardian, firstName: e.target.value as string})}/>
              <InputField className="!py-0" label="Last Name" value={newGuardian?.lastName} onChange={(e) => setNewGuardian({...newGuardian, lastName: e.target.value as string})}/>
              <InputField className="!py-0" label="Relationship with student" value={newGuardian?.relationship} onChange={(e) => setNewGuardian({...newGuardian, relationship: e.target.value as string})}/>
              <InputField className="!py-0" label="Occupation" value={newGuardian?.occupation} onChange={(e) => setNewGuardian({...newGuardian, occupation: e.target.value as string})}/>
              <InputField className="!py-0" label="Email" value={newGuardian?.email} onChange={(e) => setNewGuardian({...newGuardian, email: e.target.value as string})}/>
              <InputField className="!py-0" label="Street Address" value={newGuardian?.address} onChange={(e) => setNewGuardian({...newGuardian, address: e.target.value as string})}/>
              <InputField className="!py-0" label="Box Address"/>
              <InputField className="!py-0" label="Phone" value={newGuardian?.phone} onChange={(e) => setNewGuardian({...newGuardian, phone: e.target.value as string})}/>
            </div>
          </Dialog>
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
    </div>
  );
};

export default StudentProfile;
