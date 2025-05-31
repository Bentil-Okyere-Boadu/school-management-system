import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import InputField from "@/components/InputField";
import React, { useState } from "react";

const StudentAttendance = () => {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");

  const academicYears = [
    { value: "2023", label: "2023/2024" },
    { value: "2024", label: "2024/2025" },
  ];

  const handleSelectAcademicYear = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selected = event.target.value;
    setSelectedAcademicYear(selected);
  };

  return (
    <div>
      <div>
        <h3 className="my-4 font-bold">Attendance Summary</h3>
        <CustomSelectTag
          options={academicYears}
          optionLabel="Academic Year"
          onOptionItemClick={handleSelectAcademicYear}
        />
      </div>
      <div className="my-5">
        <div className="mb-5">{selectedAcademicYear} Academic Year</div>

        <InputField
          className="!py-0 w-[40%]"
          label="Attendance Count"
          isTransulent={true}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
          <InputField
            className="!py-0"
            label="Present Count"
            isTransulent={true}
          />
          <InputField
            className="!py-0"
            label="Present Percentage"
            isTransulent={true}
          />
          <InputField
            className="!py-0"
            label="Absent Count"
            isTransulent={true}
          />
          <InputField
            className="!py-0"
            label="Absent Persentage"
            isTransulent={true}
          />
        </div>
      </div>
    <div>

    </div>
        <h3 className="my-4 font-bold">Attendance Sheet</h3>
    </div>
  );
};

export default StudentAttendance;
