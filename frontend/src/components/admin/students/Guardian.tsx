import { Parent, ErrorResponse } from "@/@types";
import { Dialog } from "@/components/common/Dialog";
import InputField from "@/components/InputField";
import { useDeleteGuardian, useUpdateGuardian } from "@/hooks/student";
import GuardianFormFields from "./GuardianFormFields";
import { validateGuardianIdentity } from "@/utils/guardians";
import { IconPencil, IconTrashFilled } from "@tabler/icons-react";
import React, { useState } from "react";
import { toast } from "react-toastify";

interface GuardianProps {
  parent: Parent;
  count: number;
  viewMode: boolean;
  studentId: string;
  canManage: boolean;
  asAdmin?: boolean;
  refetchStudentData: () => void;
}

const Guardian = ({
  parent,
  count,
  viewMode,
  studentId,
  canManage,
  asAdmin = false,
  refetchStudentData,
}: GuardianProps) => {
  const [editParent, setEditParent] = useState(parent);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutate: deleteGuardianMutation } = useDeleteGuardian(
    parent?.id as string,
    { studentId, asAdmin },
  );
  const { mutate: updateParentMutation } = useUpdateGuardian(
    parent.id as string,
    { studentId, asAdmin },
  );

  const deleteGuardian = () => {
    deleteGuardianMutation(undefined, {
      onSuccess: () => {
        toast.success("Guardian deleted successfully.");
        refetchStudentData();
      },
      onError: (error: unknown) => {
        toast.error(
          JSON.stringify((error as ErrorResponse)?.response?.data?.message || 'Error occurred while deleting guardian.')
        );
      },
    });
  };

  const updateParent = () => {
    const error = validateGuardianIdentity(editParent);
    if (error) {
      toast.error(error);
      return;
    }

    const updatePayload: Pick<
      Parent,
      | "address"
      | "firstName"
      | "lastName"
      | "email"
      | "occupation"
      | "phone"
      | "relationship"
    > = {
      firstName: editParent.firstName.trim(),
      lastName: editParent.lastName.trim(),
      address: editParent.address,
      email: editParent.email.trim(),
      phone: editParent.phone,
      relationship: editParent.relationship,
      occupation: editParent.occupation,
    };

    updateParentMutation(updatePayload, {
      onSuccess: () => {
        toast.success("Guardian updated successfully.");
        setDialogOpen(false);
        refetchStudentData();
      },
      onError: (error: unknown) => {
        toast.error(
          JSON.stringify((error as ErrorResponse)?.response?.data?.message || 'Error occurred while updating guardian.')
        );
      }
    })
  };

  const openEdit = () => {
    setEditParent(parent);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 p-4 mb-4">
        {viewMode && (
          <div className="flex justify-between">
            <h4 className="font-bold mb-3">Guardian #{count}</h4>
            {canManage && (
              <div className="flex items-center gap-3">
                <IconPencil
                  size={18}
                  className="cursor-pointer"
                  onClick={openEdit}
                />
                <IconTrashFilled
                  size={18}
                  className="text-red-600 cursor-pointer"
                  onClick={() => deleteGuardian()}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InputField
            className="!py-0"
            label="First Name"
            value={parent.firstName}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Last Name"
            value={parent.lastName}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Relationship with student"
            value={parent.relationship}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Occupation"
            value={parent.occupation}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Email"
            value={parent.email}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Street Address"
            value={parent.address}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Phone"
            value={parent.phone}
            isTransulent={viewMode}
          />
        </div>
      </div>

      <Dialog
        isOpen={dialogOpen}
        dialogTitle="Edit Guardian"
        onClose={() => setDialogOpen(false)}
        onSave={updateParent}
        saveDisabled={!!validateGuardianIdentity(editParent)}
      >
        <GuardianFormFields value={editParent} onChange={setEditParent} />
      </Dialog>
    </>
  );
};

export default Guardian;
