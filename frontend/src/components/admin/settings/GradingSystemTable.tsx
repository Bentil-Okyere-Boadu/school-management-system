"use client";
import { Dialog } from "@/components/common/Dialog";
import { IconPencil, IconTrashFilled, IconUpload } from "@tabler/icons-react";
import React, { useState } from "react";
import CustomUnderlinedButton from "../CustomUnderlinedButton";
import InputField from "@/components/InputField";

interface GradeData {
  grade: string;
  minRange: string;
  maxRange: string;
}

export const GradingSystemTable: React.FC = () => {
  const [isConfirmDeleteGradingSystemDialogOpen, setIsConfirmDeleteGradingSystemDialogOpen] = useState(false);
  const [isGradingSystemDialogOpen, setIsGradingSystemDialogOpen] = useState(false);
  const [gradeLabel, setGradeLabel] = useState('');
  const [minRange, setMinRange] = useState('');
  const [maxRange, setMaxRange] = useState('');


  const gradeData: GradeData[] = [
    { grade: "A", minRange: "80", maxRange: "80" },
    { grade: "B", minRange: "70", maxRange: "70" },
    { grade: "C", minRange: "60", maxRange: "60" },
    { grade: "D", minRange: "50", maxRange: "50" },
  ];

  const onEditGrading = (data: GradeData) => {
    setIsGradingSystemDialogOpen(true)
    setGradeLabel(data.grade);
    setMinRange(data.minRange);
    setMaxRange(data.maxRange);
  }

  const onAddNewGrading = () => {
    setIsGradingSystemDialogOpen(true)
    setGradeLabel('');
    setMinRange('');
    setMaxRange('');
  }

  return (
  <>
    <div className="flex items-center gap-2">
      <h1 className="text-md font-semibold text-neutral-800">Grading System</h1>
      <CustomUnderlinedButton
        text="Add New"
        textColor="text-purple-500"
        onClick={() => onAddNewGrading()}
        icon={<IconUpload size={10} />}
        showIcon={false}
      />
    </div>
    <table className="w-full border-collapse">
      <thead>
        <tr className="">
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
          Grade Label
          </th>
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
          Minimum Range
          </th>
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
          Maximum Range
          </th>
          <th className="py-2 pl-2.5 text-xs text-left text-[#5B5B5B] font-normal max-md:text-sm max-sm:text-xs">
            {/* Action Buttons header */}
          </th>
        </tr>
      </thead>
      <tbody>
        {gradeData.map((data, index) => (
          <tr className="border-b border-solid border-b-gray-200" key={index + "12"}>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
            {data.grade}
            </td>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
            {data.minRange}
            </td>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
            {data.maxRange}
            </td>
            <td className="py-2 pl-2.5 text-sm text-left text-[#252C32] max-md:text-sm max-sm:text-xs">
              <div className="flex gap-3">
                <IconPencil size={18} className="cursor-pointer" onClick={() => onEditGrading(data)} />
                <IconTrashFilled size={18} className="text-red-600 cursor-pointer" onClick={() => setIsConfirmDeleteGradingSystemDialogOpen(true)} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Creating Editing Grading Dialog */}
    <Dialog 
      isOpen={isGradingSystemDialogOpen}
      busy={false}
      dialogTitle="Grading System"
      saveButtonText="Save Grading"
      onClose={() => setIsGradingSystemDialogOpen(false)} 
      onSave={() => {}}
    >
      <div className="my-3 flex flex-col gap-4">
        <InputField
          className="!py-0"
          placeholder=""
          label="Grade Label"
          value={gradeLabel}
          onChange={() => {}}
          isTransulent={false}
        />
          
        <InputField
          className="!py-0"
          placeholder=""
          label="Minimum Range"
          value={minRange}
          onChange={(e) => {setMinRange(e.target.value)}}
          type="number"
          isTransulent={false}
        />

        <InputField
          className="!py-0"
          placeholder=""
          label="Maximum Range"
          value={maxRange}
          onChange={(e) => {setMaxRange(e.target.value)}}
          type="number"
          isTransulent={false}
        />
      </div>
    </Dialog>

    {/* Confirm Delete Grading Dialog */}
    <Dialog 
      isOpen={isConfirmDeleteGradingSystemDialogOpen}
      busy={false}
      dialogTitle="Confirm Delete"
      saveButtonText="Delete Grading"
      onClose={() => setIsConfirmDeleteGradingSystemDialogOpen(false)} 
      onSave={() => {}}
    >
      <div className="my-3 flex flex-col gap-4">
        <p>
          Are you sure you want to delete this grading? You will loose all related information
        </p>
      </div>
    </Dialog>
  </>
  );
};
 