"use client";
import React, { useEffect, useState } from "react";
import InputField from "@/components/InputField";
import SchoolCard from "@/components/common/SchoolCard";
import CustomUnderlinedButton from "../CustomUnderlinedButton";
import NoProfileImg from '@/images/no-profile-img.png' 
import CustomButton from "@/components/Button";
import { useEditSchoolAdminInfo } from "@/hooks/school-admin";
import { toast } from "react-toastify";


interface ProfileTabSectionProps {
  schoolAdminInfo: {
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    role: {
      label: string;
    }
    profile: {    
      address: string;
      phoneContact: string;
      streetAddress: string;
      optionalPhoneContact: string;
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
          },
          onError: (error) => {
            toast.error(error.message);
          }
        })
      } else {
          toast.error('Some fields can not be left empty');
        }
    }



  return (
    <div className="pb-8">
        <div className="flex justify-end">
            <CustomButton text="Save Changes" loading={isPending} onClick={() => editSchoolAdminInfo()} />
        </div>

        <h1 className="text-md font-semibold text-neutral-800 mb-2">My Profile</h1>
        <section className="flex flex-wrap gap-5 items-center text-base tracking-normal text-gray-800 mt-3">
          <div className="flex flex-col w-auto">
            <SchoolCard
              key="school-1"
              logoUrl={NoProfileImg.src}
              backgroundColor="bg-[#FFF]"
            />

            <div className="flex justify-center gap-2 mt-3">
              <CustomUnderlinedButton
                text="Change Image"
                textColor="text-gray-500"
                onClick={() => {}}
                showIcon={true}
              />
              <CustomUnderlinedButton
                text="Delete"
                textColor="text-gray-500"
                onClick={() => {}}
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
    </div>
  );
};
 