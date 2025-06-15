import { Parent } from "@/@types";
import InputField from "@/components/InputField";
import { useDeleteGuardian } from "@/hooks/student";
import { IconPencil, IconTrashFilled } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "react-toastify";

interface GuardianProps {
  parent: Parent;
  count: number;
  viewMode: boolean;
  refetchStudentData: () => void;
}

const Guardian = ({ parent, count, viewMode, refetchStudentData }: GuardianProps) => {
    const { mutate: deleteGuardianMutation } = useDeleteGuardian(parent?.id as string);
    const {id} = useParams();

    const deleteGuardian = () => {
        deleteGuardianMutation( undefined, {
            onSuccess: () => {
                toast.success('Guardian deleted successfully.');
                refetchStudentData();
            },
            onError: () => {
                toast.error('Error occured while deleting guardian.');
            }
        })
    }

  return (
    <div>
      {viewMode && (<div className="flex justify-between">
        <h4 className="font-bold mb-3">Guardian #{count}</h4>
        { !id && (<div className="flex items-center gap-3">
            <IconPencil
              size={18}
              className="cursor-pointer"
              onClick={() => {}}
            />
            <IconTrashFilled
              size={18}
              className="text-red-600 cursor-pointer"
              onClick={() => deleteGuardian()}
            />
        </div>)}
      </div>)}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <InputField className="!py-0" label="First Name" value={parent.firstName} isTransulent={viewMode} />
        <InputField className="!py-0" label="Last Name" value={parent.lastName} isTransulent={viewMode} />
        <InputField
          className="!py-0"
          label="Relationship with student"
          value={parent.relationship}
          isTransulent={viewMode}
        />
        <InputField className="!py-0" label="Occupation" value={parent.occupation} isTransulent={viewMode} />
        <InputField className="!py-0" label="Email" value={parent.email} isTransulent={viewMode} />
        <InputField
          className="!py-0"
          label="Street Address"
          value={parent.address}
          isTransulent={viewMode}
        />
        <InputField className="!py-0" label="Box Address" value={parent.address} isTransulent={viewMode} />
        <InputField className="!py-0" label="Phone" value={parent.phone} isTransulent={viewMode} />
        <InputField
          className="!py-0"
          label="Phone(Optional)"
          value={parent.phone}
          isTransulent={viewMode}
        />
      </div>
    </div>
  );
};

export default Guardian;
