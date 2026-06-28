"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/common/Dialog";
import StudentSelectionTable from "@/components/admin/classes/StudentSelectionTable";
import {
  useGetStudentsForClassAssignment,
} from "@/hooks/school-admin";
import { useDebouncer } from "@/hooks/generalHooks";

interface AddStudentsDialogProps {
  isOpen: boolean;
  classId: string;
  enrolledStudentIds?: string[];
  busy?: boolean;
  onClose: () => void;
  onAdd: (studentIds: string[]) => void;
}

export const AddStudentsDialog: React.FC<AddStudentsDialogProps> = ({
  isOpen,
  classId,
  enrolledStudentIds = [],
  busy = false,
  onClose,
  onAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const debouncedSearch = useDebouncer(searchQuery);

  const { students, isLoading } = useGetStudentsForClassAssignment(
    debouncedSearch,
    true,
    classId
  );

  const availableStudents = React.useMemo(() => {
    const enrolled = new Set(enrolledStudentIds);
    return (students ?? []).filter((s) => !enrolled.has(s.id));
  }, [students, enrolledStudentIds]);

  const handleClose = () => {
    setSearchQuery("");
    setSelectedStudents([]);
    onClose();
  };

  const handleAdd = () => {
    onAdd(selectedStudents);
    setSearchQuery("");
    setSelectedStudents([]);
  };

  return (
    <Dialog
      isOpen={isOpen}
      busy={busy || isLoading}
      dialogTitle="Add Students"
      saveButtonText="Add"
      saveDisabled={selectedStudents.length === 0}
      onClose={handleClose}
      onSave={handleAdd}
      dialogWidth="w-[640px] max-w-[640px]"
    >
      <div className="my-3">
        <StudentSelectionTable
          students={availableStudents}
          selectedStudents={selectedStudents}
          onChange={setSelectedStudents}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          useFullWidthSearch
        />
      </div>
    </Dialog>
  );
};

export default AddStudentsDialog;
