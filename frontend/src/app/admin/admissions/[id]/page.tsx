"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import InputField from "@/components/InputField";
import Image from 'next/image';
import { useEditAdmission, useGetAdmissionById, useInterviewInvitation } from "@/hooks/school-admin";
import NoProfileImg from "@/images/no-profile-img.png";
import DocumentItem from "@/components/common/DocumentItem";
import { TagsInput } from "@mantine/core";
import { AdmissionStatusMenu } from "@/components/admin/admissions/AdmissionStatusMenu";
import { OptionItem } from "@/components/common/CustomSelectTag";
import { toast } from "react-toastify";
import { ErrorResponse } from "@/@types";
import { Dialog } from "@/components/common/Dialog";


const SingleAdmissionPage: React.FC = () => {
  const params = useParams();
  const applicationId = params.id; 

  const [isInterviewInviteDialogOpen, setIsInterviewInviteDialogOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");

  const onHandleDocumentClick = (docUrl: string) => {
    const link = document.createElement("a");
    link.href = docUrl;
    link.download = 'birtCert';
    link.target = "_blank"; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const { admissionData, refetch: admissionRefetch } = useGetAdmissionById(applicationId as string);


  const onHandleAdmissionStatusChange = (optionItem: OptionItem) => {
    const sSelectedStatus = optionItem.value;

    if(sSelectedStatus == "interview-invite") {
      setInterviewTime("");
      setInterviewDate("");
      setIsInterviewInviteDialogOpen(true);
    } else {
      updateAdmissionStatus(sSelectedStatus);
    }
  }

  const { mutate: editMutation } = useEditAdmission(applicationId as string);

  const updateAdmissionStatus = (sSelectedStatus: string) => {
    editMutation({ status: sSelectedStatus}, {
      onSuccess: () => {
        toast.success('Successfully updated admission status.')
        admissionRefetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const { mutate: interviewInvite, isPending: isInterviewInvitePending } = useInterviewInvitation(applicationId as string);

  const sendInterviewInvite = () => {
    if(interviewDate && interviewTime){
      interviewInvite({ interviewDate: interviewDate, interviewTime: interviewTime }, {
        onSuccess: () => {
          toast.success('Interview invitation sent successfully.');
          setInterviewTime("");
          setInterviewDate("");
          setIsInterviewInviteDialogOpen(false);
          admissionRefetch();
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
      <div className="flex w-full">
        {/* Personal Information */}
        <div className="flex flex-col justify-center w-full">
          <div className="flex justify-between items-center mr-10">
            <h3 className="font-bold mb-3">Student Information</h3>
            <AdmissionStatusMenu 
              status={admissionData?.status} 
              admissionId={admissionData?.applicationId}
              onStatusClick={(option) => onHandleAdmissionStatusChange(option)} /> 
          </div>
          <Image
            src={admissionData?.studentHeadshotUrl ? (admissionData.studentHeadshotUrl as string) : NoProfileImg.src}
            width={150}
            height={130}
            alt="studentProfilePic"
            className="rounded-[8px]"
          />
        </div>
      </div>
      {/* Bio Data */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <InputField
          className="!py-0"
          label="First Name"
          isTransulent={true}
          value={admissionData?.studentFirstName}
        />
        <InputField 
          className="!py-0"  
          label="Last Name" 
          value={admissionData?.studentLastName} 
          isTransulent={true}
        />
        <InputField
          className="!py-0"
          label="Other Names"
          value={admissionData?.studentOtherNames}
          isTransulent={true}
        />
        <InputField
          className="!py-0"
          label="Email"
          type="Email"
          isTransulent={true}
          value={admissionData?.studentEmail}
        />
        <InputField
          className="!py-0"
          label="Date of Birth"
          isTransulent={true}
          value={admissionData?.studentDOB}
        />
        <InputField
          className="!py-0"
          label="Place of Birth"
          isTransulent={true}
          value={admissionData?.studentPlaceOfBirth}
        />
        <InputField 
          className="!py-0" 
          label="Gender" 
          isTransulent={true} 
          value={admissionData?.studentGender} />
        <InputField 
          className="!py-0" 
          label="Nationality" 
          isTransulent={true} 
          value={admissionData?.studentNationality} />
        <div>
          <p className="text-xs mb-1.5 text-[#52525c]">Upload Birth Certificate</p>
          <div className="flex gap-3 flex-wrap">
           {admissionData?.studentBirthCertUrl && 
           <DocumentItem
                key={'birthcert'}
                name='Birth cert'
                onCardClick={() => onHandleDocumentClick(admissionData?.studentBirthCertUrl)}
            />
           } 
          </div>
        </div>
          <InputField
              label="Religion"
              isTransulent={true}
              readOnly={true}
              value={admissionData?.studentReligion}
          />
          <TagsInput
              label="Languages Spoken"
              readOnly
              className="-mt-2 mb-2 sm:mb-0"
              classNames={{
                  input: '!border-[0px] !bg-[#8787871A]',
                  pill: '!bg-[#fff] !text-black', 
              }}
              value={admissionData?.studentLanguages || []}
          />
          <InputField
            label="Street Address"
            isTransulent={true}
            readOnly={true}
            value={admissionData?.studentStreetAddress}
          />
          <InputField
            label="Box Address"
            isTransulent={true}
            readOnly={true}
            value={admissionData?.studentBoxAddress}
          />
          <InputField
              label="Phone"
              isTransulent={true}
              readOnly={true}
              value={admissionData?.studentPhone}
          />

          <InputField
              label="Anticipated Academic Year"
              isTransulent={true}
              readOnly={true}
              value={admissionData?.academicYear}
          />
          <InputField
              label="For Class"
              isTransulent={true}
              readOnly={true}
              value={admissionData?.forClass?.name}
          />
      </div>    
      
      {/* Family Information */}
      <div className="mt-15">
        <h3 className="font-bold mb-3">Family Information</h3>
        {admissionData?.guardians?.map((guardian, idx) => (
          <div key={idx} className="mt-6">
            <h4 className='font-bold mb-0.5'>Guardian #{idx + 1}</h4>
            <div className='mb-4'>
              <Image
                src={guardian?.headshotUrl? (guardian?.headshotUrl as string) : NoProfileImg.src}
                width={160}
                height={130}
                alt="studentProfilePic"
                className="rounded-[8px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <InputField
                  label="First Name"       
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.firstName}
              />
              <InputField
                  label="Last Name"
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.lastName}
              />
              <InputField
                  label="Relationship to applicant"
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.relationship}
              />
              <InputField
                  label="Email"
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.email}
              />
              <InputField
                  label="Nationality"
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.nationality}
              />
              <InputField
                  label="Occupation"
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.occupation}
              />
              <InputField
                  label="Company"
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.company}
              />
              <InputField
                  label="Street Address"
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.streetAddress}
              />
              <InputField
                  label="Box Address"
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.boxAddress}
              />
              <InputField
                  label="Phone"
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.guardianPhone}
              />
              <InputField
                  label="Optional Phone"
                  isTransulent={true}
                  readOnly={true}
                  value={guardian.guardianOtherPhone}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Academic Information */}
      <div className="mt-15">
        <h3 className="font-bold mb-3">Additional Information</h3>
        <h4 className="font-bold mb-3">Home Survey</h4>
        <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2 my-3">
          <InputField
              label="What is the primary language used in the home?"
              isTransulent={true}
              readOnly={true}
              value={admissionData?.homePrimaryLanguage}
          />
          <InputField
              label="What is the first language most often used by the student?"
              isTransulent={true}
              readOnly={true}
              value={admissionData?.homeOtherLanguage}
          />
        </div>
        <h4 className="font-bold mb-3">Academic History</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField className="!py-0" label="Did the applicant attend another school before this?" isTransulent={true} value={admissionData?.previousSchoolName ? 'Yes' : 'No'} />
        </div>

        {admissionData?.previousSchoolName && (
          <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2">
            <InputField
                label="School Name"
                required
                isTransulent={true}
                readOnly={true}
                value={admissionData?.previousSchoolName}
            />
            <InputField
                label="School URL"
                required
                isTransulent={true}
                readOnly={true}
                value={admissionData?.previousSchoolUrl}
            />
            <InputField
                label="Street Address"
                required
                isTransulent={true}
                readOnly={true}
                value={admissionData?.previousSchoolStreetAddress}
            />
            <InputField
                label="City"
                required
                isTransulent={true}
                readOnly={true}
                value={admissionData?.previousSchoolCity}
            />
            <InputField
                label="State"
                required
                isTransulent={true}
                readOnly={true}
                value={admissionData?.previousSchoolState}
            />
            <InputField
                label="Country"
                required
                isTransulent={true}
                readOnly={true}
                value={admissionData?.previousSchoolCountry}
            />
            <InputField
                label="Attended From"
                isTransulent={true}
                readOnly={true}
                value={admissionData?.previousSchoolAttendedFrom}
            />
            <InputField
                label="Attended To"
                isTransulent={true}
                readOnly={true}
                value={admissionData?.previousSchoolAttendedTo}
            />
            <InputField
                label="Grade / Class"
                required
                isTransulent={true}
                readOnly={true}
                value={admissionData?.previousSchoolGradeClass}
            />
            <div>
              <p className="text-xs mb-1.5 text-[#52525c]">Upload Previous Report Cards (at least 1 in pdf, png or jpeg)<span className="text-red-500 ml-0.5">*</span></p>
              <div className="flex gap-3 flex-wrap">
                {admissionData?.previousSchoolResults?.map((doc, index) => (
                  <DocumentItem
                    key={`${doc.id}`}
                    name={`Report doc-${index}`}
                    onCardClick={() => onHandleDocumentClick(doc.fileUrl)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

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

export default SingleAdmissionPage;