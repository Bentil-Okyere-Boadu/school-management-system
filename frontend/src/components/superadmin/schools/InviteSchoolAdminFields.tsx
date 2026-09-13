"use client";
import React from "react";
import InputField from "@/components/InputField";
import { InviteSchoolAdminFormValues } from "@/hooks/invite-school-admin";

interface InviteSchoolAdminFieldsProps {
  values: InviteSchoolAdminFormValues;
  onChange: (values: InviteSchoolAdminFormValues) => void;
  busy?: boolean;
  helpText?: string;
}

const InviteSchoolAdminFields: React.FC<InviteSchoolAdminFieldsProps> = ({
  values,
  onChange,
  busy = false,
  helpText = "User will receive email to accept invite and sign up",
}) => {
  const setField =
    (field: keyof InviteSchoolAdminFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...values, [field]: event.target.value });

  return (
    <>
      <p className="text-xs text-gray-500">{helpText}</p>
      <div className="my-3 flex flex-col gap-4">
        <InputField
          className="!py-0"
          label="First Name"
          required
          value={values.firstName}
          onChange={setField("firstName")}
          isTransulent={busy}
        />

        <InputField
          className="!py-0"
          label="Last Name"
          required
          value={values.lastName}
          onChange={setField("lastName")}
          isTransulent={busy}
        />

        <InputField
          label="Email"
          required
          value={values.email}
          onChange={setField("email")}
          isTransulent={busy}
        />
      </div>
    </>
  );
};

export default InviteSchoolAdminFields;
