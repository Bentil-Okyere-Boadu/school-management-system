"use client";
import React from "react";
import { useParams } from "next/navigation";
import InputField from "@/components/InputField";
import Image from 'next/image';
import { useGetAdmissionById } from "@/hooks/school-admin";
import NoProfileImg from "@/images/no-profile-img.png";
import DocumentItem from "@/components/common/DocumentItem";
import { TagsInput } from "@mantine/core";


const SingleAdmissionPage: React.FC = () => {
  const params = useParams();
  const applicationId = params.id; 

  const onHandleDocumentClick = (docUrl: string) => {
    const link = document.createElement("a");
    link.href = docUrl;
    link.download = 'birtCert';
    link.target = "_blank"; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const { admissionData } = useGetAdmissionById(applicationId as string);

  console.log(admissionData, "admins");




  return (
    <div>
      <div className="flex justify-between flex-row">
        {/* Personal Information */}
        <div className="flex flex-col justify-center">
          <h3 className="font-bold mb-3">Student Information</h3>
          <Image
            src={admissionData?.studentHeadshotUrl ? (admissionData.studentHeadshotUrl as string) : NoProfileImg.src}
            width={150}
            height={300}
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
          value={''}
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
              value={admissionData?.studentLanguages}
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
                        {/* {admissionData?.previousSchool?.reportCards?.map((doc) => (
                            <DocumentItem
                                key={`${doc.name}-${doc.lastModified}`}
                                name={doc.name}
                            />
                        ))} */}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SingleAdmissionPage;