"use client";
import { Dialog } from "@/components/common/Dialog";
import { IconPencil, IconTrashFilled } from "@tabler/icons-react";
import React, { useState } from "react";
import CustomUnderlinedButton from "../CustomUnderlinedButton";
import InputField from "@/components/InputField";
import NoAvailableEmptyState from "../../common/NoAvailableEmptyState";
import { ErrorResponse, ClassLevel } from "@/@types";
import { useCreateClassLevel, useDeleteClassLevel, useEditClassLevel, useGetClassLevels } from "@/hooks/school-admin";
import { toast } from "react-toastify";

export const ClassLevelsTable: React.FC = () => {
  const [isConfirmDeleteClassLevelDialogOpen, setIsConfirmDeleteClassLevelDialogOpen] = useState(false);
  const [isClassLevelDialogOpen, setIsClassLevelDialogOpen] = useState(false);
  const [classLevelName, setClassLevelName] = useState('');
  const [classLevelDescription, setClassLevelDescription] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [classLevelId, setClassLevelId] = useState('');

  const { classLevels, refetch } = useGetClassLevels();
  const { mutate: editMutation, isPending: pendingEdit } = useEditClassLevel(classLevelId);
  const { mutate: deleteMutation, isPending: pendingDelete } = useDeleteClassLevel();
  const { mutate: createMutation, isPending: pendingCreate } = useCreateClassLevel();
  
  const onEditClassLevelClick = (data: Partial<ClassLevel>) => {
    setEditMode(true);
    setClassLevelId(data.id as string);
    setIsClassLevelDialogOpen(true);
    setClassLevelName(data.name as string);
    setClassLevelDescription(data.description as string);
  }

  const editClassLevel = () => {
    editMutation({ name: classLevelName, description: classLevelDescription}, {
      onSuccess: () => {
        toast.success('Successfully updated classLevel.')
        setIsClassLevelDialogOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const createClassLevel = () => {
    createMutation({ name: classLevelName, description: classLevelDescription}, {
      onSuccess: () => {
        toast.success('Successfully created classLevel.')
        setIsClassLevelDialogOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const deleteClassLevel = () => {
    deleteMutation(classLevelId, {
      onSuccess: () => {
        toast.success('Deleted successfully.');
        setIsConfirmDeleteClassLevelDialogOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const onDeleteButtonClick = (sId: string) => {
    setIsConfirmDeleteClassLevelDialogOpen(true);
    setClassLevelId(sId);
  }

  const onAddNewClassLevel = () => {
    setIsClassLevelDialogOpen(true)
    setClassLevelName('');
    setClassLevelDescription('');
    setEditMode(false);
    setClassLevelId('');
  }

  return (
  <>
    <div className="flex items-center gap-2">
      <h1 className="text-md font-semibold text-neutral-800">Class Levels</h1>
      <CustomUnderlinedButton
        text="Add New"
        textColor="text-purple-500"
        onClick={() => onAddNewClassLevel()}
        showIcon={false}
      />
    </div>
    <table className="w-full border-collapse">
      <thead>
        <tr className="">
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
            Name
          </th>
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
            Description
          </th>
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
            {/* Action Buttons header */}
          </th>
        </tr>
      </thead>
      <tbody>
        {
        classLevels.length > 0 && classLevels.map((data, index) => (
          <tr className="border-b border-solid border-b-gray-200" key={index + "12"}>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
              {data.name}
            </td>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
              {data.description || '--'}
            </td>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
              <div className="flex gap-3">
                <IconPencil size={18} className="cursor-pointer" onClick={() => onEditClassLevelClick(data)} />
                <IconTrashFilled size={18} className="text-red-600 cursor-pointer" onClick={() => onDeleteButtonClick(data.id)} />
              </div>
            </td>
          </tr>
        )) 
      }
      </tbody>
    </table>
    {
      classLevels.length === 0 && (
          <NoAvailableEmptyState message="No classLevel available, click ‘Add New’ to create one." />
        )
    }

    {/* Creating/Editing ClassLevel Dialog */}
    <Dialog 
      isOpen={isClassLevelDialogOpen}
      busy={editMode? pendingEdit : pendingCreate}
      dialogTitle={`${editMode ? 'Edit' : 'Add New'} ClassLevel`}
      saveButtonText="Save"
      onClose={() => setIsClassLevelDialogOpen(false)} 
      onSave={editMode? editClassLevel : createClassLevel }
    >
      <div className="my-3 flex flex-col gap-4">
        <InputField
          className="!py-0"
          placeholder=""
          label="Name"
          value={classLevelName}
          onChange={(e) => { setClassLevelName(e.target.value)}}
          isTransulent={false}
        />
        <InputField
          className="!py-0"
          placeholder=""
          label="Description"
          value={classLevelDescription}
          onChange={(e) => { setClassLevelDescription(e.target.value)}}
          isTransulent={false}
        /> 
      </div>
    </Dialog>

    {/* Confirm Delete ClassLevel Dialog */}
    <Dialog 
      isOpen={isConfirmDeleteClassLevelDialogOpen}
      busy={pendingDelete}
      dialogTitle="Confirm Delete"
      saveButtonText="Delete"
      onClose={() => { setIsConfirmDeleteClassLevelDialogOpen(false)}} 
      onSave={deleteClassLevel}
    >
      <div className="my-3 flex flex-col gap-4">
        <p>
          Are you sure you want to delete this classLevel? You will loose all related information
        </p>
      </div>
    </Dialog>
  </>
  );
};
 