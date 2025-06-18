import { Parent } from "@/@types";
import { Dialog } from "@/components/common/Dialog";
import InputField from "@/components/InputField";
import { useDeleteGuardian, useUpdateGuardian } from "@/hooks/student";
import { IconPencil, IconTrashFilled } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

interface GuardianProps {
  parent: Parent;
  count: number;
  viewMode: boolean;
  refetchStudentData: () => void;
}

const Guardian = ({
  parent,
  count,
  viewMode,
  refetchStudentData,
}: GuardianProps) => {
  const [editParent, setEditParent] = useState(parent);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutate: deleteGuardianMutation } = useDeleteGuardian(
    parent?.id as string
  );
  const { mutate: updateParentMutation } = useUpdateGuardian(
    parent.id as string
  );
  const { id } = useParams();

  const deleteGuardian = () => {
    deleteGuardianMutation(undefined, {
      onSuccess: () => {
        toast.success("Guardian deleted successfully.");
        refetchStudentData();
      },
      onError: () => {
        toast.error("Error occured while deleting guardian.");
      },
    });
  };

  const updateParent = () => {
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
      firstName: editParent.firstName,
      lastName: editParent.lastName,
      address: editParent.address,
      email: editParent.email,
      phone: editParent.phone,
      relationship: editParent.relationship,
      occupation: editParent.occupation,
    };

    updateParentMutation(updatePayload, {
      onSuccess: () => {
        toast.success("Guardian updated successfully.");
        setDialogOpen(false);
        setEditParent({} as Parent);
        refetchStudentData();
      },
      onError: () => {
        toast.error("Error occured while updating guardian.");
      }
    })
  };

  return (
    <>
      <div>
        {viewMode && (
          <div className="flex justify-between">
            <h4 className="font-bold mb-3">Guardian #{count}</h4>
            {!id && (
              <div className="flex items-center gap-3">
                <IconPencil
                  size={18}
                  className="cursor-pointer"
                  onClick={() => setDialogOpen(true)}
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
            label="Box Address"
            value={parent.address}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Phone"
            value={parent.phone}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Phone(Optional)"
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
      >
        <div className="flex flex-col mt-3">
          <InputField
            className="!py-0"
            label="First Name"
            value={editParent?.firstName}
            onChange={(e) =>
              setEditParent({
                ...editParent,
                firstName: e.target.value as string,
              })
            }
          />
          <InputField
            className="!py-0"
            label="Last Name"
            value={editParent?.lastName}
            onChange={(e) =>
              setEditParent({
                ...editParent,
                lastName: e.target.value as string,
              })
            }
          />
          <InputField
            className="!py-0"
            label="Relationship with student"
            value={editParent?.relationship}
            onChange={(e) =>
              setEditParent({
                ...editParent,
                relationship: e.target.value as string,
              })
            }
          />
          <InputField
            className="!py-0"
            label="Occupation"
            value={editParent?.occupation}
            onChange={(e) =>
              setEditParent({
                ...editParent,
                occupation: e.target.value as string,
              })
            }
          />
          <InputField
            className="!py-0"
            label="Email"
            value={editParent?.email}
            onChange={(e) =>
              setEditParent({ ...editParent, email: e.target.value as string })
            }
          />
          <InputField
            className="!py-0"
            label="Street Address"
            value={editParent?.address}
            onChange={(e) =>
              setEditParent({
                ...editParent,
                address: e.target.value as string,
              })
            }
          />
          <InputField className="!py-0" label="Box Address" />
          <InputField
            className="!py-0"
            label="Phone"
            value={editParent?.phone}
            onChange={(e) =>
              setEditParent({ ...editParent, phone: e.target.value as string })
            }
          />
        </div>
      </Dialog>
    </>
  );
};

export default Guardian;
