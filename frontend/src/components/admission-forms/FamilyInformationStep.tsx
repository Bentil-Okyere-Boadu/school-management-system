"use client";
import React,  { useMemo } from "react";
import InputField from "../InputField";
import CustomButton from "../Button";
import Image from "next/image";
import HomeIcon from "@/images/admission-home-logo.svg";
import { IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { Guardian } from "@/@types/index";
import countryList from 'react-select-country-list';
import { Select } from '@mantine/core';

interface FamilyInfoProps {
  guardians: Guardian[];
  setGuardians: React.Dispatch<React.SetStateAction<Guardian[]>>;
}

  const FamilyInformationStep: React.FC<FamilyInfoProps> = ({ guardians, setGuardians }) => {

  // Retrieve a list of countries [label: 'Ghana', value: 'GH']
  const countryOptions = useMemo(() => {
    return countryList()
        .getData()
        .map((option) => ({
            value: option.label, // use label as value
            label: option.label,
        }));
    }, []);

  const handleFieldChange = (index: number, field: keyof Guardian, value: string | File) => {
    setGuardians((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addGuardian = () => {
    setGuardians((prev) => [
      ...prev,
      {
        firstName: "",
        lastName: "",
        relationship: "",
        email: "",
        nationality: "",
        occupation: "",
        company: "",
        streetAddress: "",
        boxAddress: "",
        phone: "",
        optionalPhone: "",
        headshotFile: undefined,
      },
    ]);
  };

  const removeGuardian = (indexToRemove: number) => {
    setGuardians((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="mt-14 mx-auto">
      <div className="flex flex-col items-center">
        <Image
          src={HomeIcon}
          width={100}
          height={100}
          alt="Home Logo"
          className="w-15 h-15 rounded-full object-cover"
        />
        <h3 className="font-bold mt-4 mb-2">Family Information</h3>
        <p className="text-sm text-center">
          Please provide your family information to support your application.
        </p>
      </div>

      {guardians.map((guardian, index) => (
        <div key={index} className="mt-8">
          <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold">Guardian {index + 1}</h4>
              {guardians.length > 1 && (
                <button
                  onClick={() => removeGuardian(index)}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                  title="Remove Guardian"
                >
                  <IconTrash size={18} />
                </button>
              )}
          </div>
          <div className="grid gap-1 md:gap-3 grid-cols-1 md:grid-cols-2">
            <div className="mb-4">
              <p className="text-xs mb-1 text-[#52525c]">Upload Recent Headshot<span className="text-red-500 ml-0.5">*</span></p>
              {!guardian?.headshotFile ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    id={`guardian-headshot-${index}`}
                    className="hidden"
                    onChange={(e) => handleFieldChange(index, "headshotFile", e.target.files?.[0] || "")}
                  />
                  <CustomButton
                    variant="outline"
                    className="!py-1"
                    text="Choose file"
                    onClick={() =>
                      document.getElementById(`guardian-headshot-${index}`)?.click()
                    }
                  />
                </>
                ) : (
                  <div className="mt-2 relative inline-block">
                    <Image
                      src={URL.createObjectURL(guardian.headshotFile)}
                      width={100}
                      height={100}
                      alt="Headshot Preview"
                      className="w-14 h-14 rounded-full object-cover shrink-0"
                    />
                    <IconX
                      onClick={() => handleFieldChange(index, "headshotFile", "")}
                      size={24}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 bg-white rounded-full shadow p-1 hover:bg-red-100 cursor-pointer"
                    />
                  </div>
                )}
            </div>
            {/* Code below occupies the right space */}
            <div />

            <InputField
              label="First Name"
              required
              isTransulent={false}
              value={guardian.firstName}
              onChange={(e) =>
                handleFieldChange(index, "firstName", e.target.value)
              }
            />
            <InputField
              label="Last Name"
              required
              isTransulent={false}
              value={guardian.lastName}
              onChange={(e) =>
                handleFieldChange(index, "lastName", e.target.value)
              }
            />
            <InputField
              label="Relationship to applicant"
              required
              isTransulent={false}
              value={guardian.relationship}
              onChange={(e) =>
                handleFieldChange(index, "relationship", e.target.value)
              }
            />
            <InputField
              label="Email"
              required
              isTransulent={false}
              value={guardian.email}
              onChange={(e) =>
                handleFieldChange(index, "email", e.target.value)
              }
            />
            <Select
              required
              label="Nationality"
              data={countryOptions}
              value={guardian.nationality}
              searchable
              className="-mt-2 mb-2 sm:mb-0"
              onChange={(value) => handleFieldChange(index, 'nationality', value ?? '')}
            />
            <InputField
              label="Occupation"
              required
              isTransulent={false}
              value={guardian.occupation}
              onChange={(e) =>
                handleFieldChange(index, "occupation", e.target.value)
              }
            />
            <InputField
              label="Company"
              isTransulent={false}
              value={guardian.company}
              onChange={(e) =>
                handleFieldChange(index, "company", e.target.value)
              }
            />
            <InputField
              label="Street Address"
              required
              isTransulent={false}
              value={guardian.streetAddress}
              onChange={(e) =>
                handleFieldChange(index, "streetAddress", e.target.value)
              }
            />
            <InputField
              label="Box Address"
              required
              isTransulent={false}
              value={guardian.boxAddress}
              onChange={(e) =>
                handleFieldChange(index, "boxAddress", e.target.value)
              }
            />
            <InputField
              label="Phone"
              required
              isTransulent={false}
              value={guardian.phone}
              onChange={(e) =>
                handleFieldChange(index, "phone", e.target.value)
              }
            />
            <InputField
              label="Optional Phone"
              isTransulent={false}
              value={guardian.optionalPhone}
              onChange={(e) =>
                handleFieldChange(index, "optionalPhone", e.target.value)
              }
            />
          </div>
        </div>
      ))}

      {/* Add Guardian Button */}
      <div className="flex justify-end mt-6">
        <div className="flex flex-col items-center">
          <CustomButton
            variant="outline"
            className="!py-2 !px-2"
            icon={<IconPlus />}
            hideText
            onClick={addGuardian}
          />
          <span className="mt-1 text-xs">Add Guardian Information</span>
        </div>
      </div>
    </div>
  );
};

export default FamilyInformationStep;