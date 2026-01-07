"use client";
import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/common/Dialog";
import InputField from "@/components/InputField";
import CustomUnderlinedButton from "../../common/CustomUnderlinedButton";
import { School } from "@/@types";
import { useUpdateGradingPercentages, useGetMySchool } from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { ErrorResponse } from "@/@types";

interface GradingPercentagesSectionProps {
  schoolData: School;
}

export const GradingPercentagesSection: React.FC<GradingPercentagesSectionProps> = ({ schoolData }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [classScorePercentage, setClassScorePercentage] = useState<number>(
    schoolData?.classScorePercentage || 30
  );
  const [examScorePercentage, setExamScorePercentage] = useState<number>(
    schoolData?.examScorePercentage || 70
  );

  const { refetch } = useGetMySchool();
  const { mutate: updateGradingPercentages, isPending } = useUpdateGradingPercentages();

  useEffect(() => {
    if (schoolData) {
      setClassScorePercentage(schoolData.classScorePercentage || 30);
      setExamScorePercentage(schoolData.examScorePercentage || 70);
    }
  }, [schoolData]);

  const handleSave = () => {
    const total = classScorePercentage + examScorePercentage;
    if (Math.abs(total - 100) > 0.01) {
      toast.error("Class score and exam score percentages must sum to 100");
      return;
    }

    if (!schoolData?.id) {
      toast.error("School ID not found");
      return;
    }

    updateGradingPercentages(
      {
        schoolId: schoolData.id,
        classScorePercentage,
        examScorePercentage,
      },
      {
        onSuccess: () => {
          toast.success("Grading percentages updated successfully");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(
            JSON.stringify(
              (error as ErrorResponse)?.response?.data?.message ||
                "Failed to update grading percentages"
            )
          );
        },
      }
    );
  };

  const handleClassScoreChange = (value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setClassScorePercentage(numValue);
      setExamScorePercentage(100 - numValue);
    }
  };

  const handleExamScoreChange = (value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setExamScorePercentage(numValue);
      setClassScorePercentage(100 - numValue);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <h1 className="text-md font-semibold text-neutral-800">
          Grading Percentages
        </h1>
        <CustomUnderlinedButton
          text="Edit"
          textColor="text-purple-500"
          onClick={() => setIsDialogOpen(true)}
          showIcon={false}
        />
      </div>
      <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
        <div>
          <p className="text-sm text-gray-600 mb-1">Class Score Percentage</p>
          <p className="text-lg font-semibold text-gray-800">
            {schoolData?.classScorePercentage || 30}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Exam Score Percentage</p>
          <p className="text-lg font-semibold text-gray-800">
            {schoolData?.examScorePercentage || 70}%
          </p>
        </div>
      </div>

      <Dialog
        isOpen={isDialogOpen}
        busy={isPending}
        dialogTitle="Edit Grading Percentages"
        saveButtonText="Save Changes"
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
      >
        <div className="my-3 flex flex-col gap-4">
          <p className="text-xs text-gray-500 mb-2">
            The percentages must sum to 100. Changing one will automatically update the other.
          </p>
          <InputField
            className="!py-0"
            placeholder="Enter class score percentage"
            label="Class Score Percentage (%)"
            type="number"
            min="0"
            max="100"
            value={classScorePercentage.toString()}
            onChange={(e) => handleClassScoreChange(e.target.value)}
            isTransulent={false}
          />
          <InputField
            className="!py-0"
            placeholder="Enter exam score percentage"
            label="Exam Score Percentage (%)"
            type="number"
            min="0"
            max="100"
            value={examScorePercentage.toString()}
            onChange={(e) => handleExamScoreChange(e.target.value)}
            isTransulent={false}
          />
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{classScorePercentage + examScorePercentage}%</span>
            </p>
            {Math.abs(classScorePercentage + examScorePercentage - 100) > 0.01 && (
              <p className="text-xs text-red-500 mt-1">
                Percentages must sum to 100%
              </p>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
};

