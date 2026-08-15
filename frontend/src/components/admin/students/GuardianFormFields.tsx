import { Parent } from "@/@types";
import InputField from "@/components/InputField";
import { relationshipSelectData } from "@/utils/guardians";
import { Select } from "@mantine/core";
import React from "react";

interface GuardianFormFieldsProps {
  value: Parent;
  onChange: (next: Parent) => void;
}

const selectClassNames = {
  label: "mb-1.5 text-xs text-zinc-600 font-normal",
  input: "h-10 rounded border-[0.5px] border-zinc-500",
};

const GuardianFormFields = ({ value, onChange }: GuardianFormFieldsProps) => {
  const update = (patch: Partial<Parent>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col mt-3">
      <InputField
        className="!py-0"
        label="First Name"
        required
        value={value.firstName}
        onChange={(e) => update({ firstName: e.target.value })}
      />
      <InputField
        className="!py-0"
        label="Last Name"
        required
        value={value.lastName}
        onChange={(e) => update({ lastName: e.target.value })}
      />
      <Select
        label="Relationship"
        required
        placeholder="Select relationship"
        data={relationshipSelectData(value.relationship)}
        value={value.relationship || null}
        onChange={(selected) => update({ relationship: selected ?? "" })}
        className="mb-4"
        classNames={selectClassNames}
      />
      <InputField
        className="!py-0"
        label="Email"
        type="email"
        required
        value={value.email}
        onChange={(e) => update({ email: e.target.value })}
      />
      <InputField
        className="!py-0"
        label="Occupation"
        value={value.occupation}
        onChange={(e) => update({ occupation: e.target.value })}
      />
      <InputField
        className="!py-0"
        label="Street Address"
        value={value.address}
        onChange={(e) => update({ address: e.target.value })}
      />
      <InputField
        className="!py-0"
        label="Phone"
        value={value.phone}
        onChange={(e) => update({ phone: e.target.value })}
      />
    </div>
  );
};

export default GuardianFormFields;
