"use client";

import React from "react";
import { Select } from "@mantine/core";
import { Dialog } from "@/components/common/Dialog";
import InputField from "@/components/InputField";

interface TeacherOption {
  value: string;
  label: string;
}

interface EditClassDialogProps {
  isOpen: boolean;
  busy?: boolean;
  name: string;
  description: string;
  classTeacherId: string;
  teacherOptions: TeacherOption[];
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTeacherChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const EditClassDialog: React.FC<EditClassDialogProps> = ({
  isOpen,
  busy = false,
  name,
  description,
  classTeacherId,
  teacherOptions,
  onNameChange,
  onDescriptionChange,
  onTeacherChange,
  onClose,
  onSave,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      busy={busy}
      dialogTitle="Edit Class"
      saveButtonText="Save"
      onClose={onClose}
      onSave={onSave}
    >
      <div className="my-3 flex flex-col gap-4">
        <InputField
          className="!py-0"
          placeholder=""
          label="Name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          isTransulent={false}
        />
        <InputField
          className="!py-0"
          placeholder=""
          label="Description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          isTransulent={false}
        />
        <Select
          label="Class Teacher"
          placeholder="Pick teacher"
          data={teacherOptions}
          value={classTeacherId || null}
          onChange={(value) => onTeacherChange(value ?? "")}
          searchable
        />
        <p className="text-xs text-gray-500">
          Manage enrolled students from the Students tab using &apos;Add
          Students&apos; and &apos;Remove Students&apos;.
        </p>
      </div>
    </Dialog>
  );
};

export default EditClassDialog;
