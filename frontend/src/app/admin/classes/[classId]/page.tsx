"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconEdit,
  IconSchool,
  IconTrash,
  IconUserPlus,
  IconUserStar,
} from "@tabler/icons-react";
import CustomButton from "@/components/Button";
import FullPageSpinner from "@/components/common/FullPageSpinner";
import { ClassEnrolledStudentsTable } from "@/components/admin/classes/ClassEnrolledStudentsTable";
import { AddStudentsDialog } from "@/components/admin/classes/AddStudentsDialog";
import { EditClassDialog } from "@/components/admin/classes/EditClassDialog";
import {
  useEditClassLevel,
  useGetClassLevelById,
  useGetSchoolUsers,
} from "@/hooks/school-admin";
import { ErrorResponse, Student, User } from "@/@types";
import { toast } from "react-toastify";

const ClassDetailPage = () => {
  const { classId } = useParams();
  const router = useRouter();
  const id = classId as string;

  const { classLevel, isLoading, refetch } = useGetClassLevelById(id);
  const { mutate: editMutation, isPending: pendingEdit } = useEditClassLevel(id);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [selectedForRemoval, setSelectedForRemoval] = useState<string[]>([]);

  const [classLevelName, setClassLevelName] = useState("");
  const [classLevelDescription, setClassLevelDescription] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const { schoolUsers: schoolTeachers } = useGetSchoolUsers(
    1,
    "",
    "",
    "",
    "Teacher",
    500
  );

  const teacherOptions = useMemo(
    () =>
      (schoolTeachers ?? []).map((teacher: User) => ({
        value: teacher.id,
        label: `${teacher.firstName} ${teacher.lastName}`,
      })),
    [schoolTeachers]
  );

  const enrolledStudents = useMemo(
    () => (classLevel?.students ?? []) as Student[],
    [classLevel?.students]
  );

  useEffect(() => {
    if (!classLevel) return;
    setClassLevelName(classLevel.name ?? "");
    setClassLevelDescription(classLevel.description ?? "");
    setSelectedTeacher(classLevel.classTeacher?.id ?? "");
  }, [classLevel]);

  const openEditDialog = () => {
    if (!classLevel) return;
    setClassLevelName(classLevel.name ?? "");
    setClassLevelDescription(classLevel.description ?? "");
    setSelectedTeacher(classLevel.classTeacher?.id ?? "");
    setIsEditDialogOpen(true);
  };

  const handleEditClass = () => {
    editMutation(
      {
        name: classLevelName,
        description: classLevelDescription,
        classTeacherId: selectedTeacher,
      },
      {
        onSuccess: () => {
          toast.success("Successfully updated class.");
          setIsEditDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(
            JSON.stringify((error as ErrorResponse).response.data.message)
          );
        },
      }
    );
  };

  const handleAddStudents = (newStudentIds: string[]) => {
    const existingIds = enrolledStudents.map((s) => s.id);
    const mergedIds = [...existingIds, ...newStudentIds];

    editMutation(
      { studentIds: mergedIds },
      {
        onSuccess: () => {
          toast.success("Students added successfully.");
          setIsAddDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(
            JSON.stringify((error as ErrorResponse).response.data.message)
          );
        },
      }
    );
  };

  const handleRemoveStudents = () => {
    if (selectedForRemoval.length === 0) return;

    const remainingIds = enrolledStudents
      .map((s) => s.id)
      .filter((sid) => !selectedForRemoval.includes(sid));

    editMutation(
      { studentIds: remainingIds },
      {
        onSuccess: () => {
          toast.success("Students removed successfully.");
          setIsRemoveMode(false);
          setSelectedForRemoval([]);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(
            JSON.stringify((error as ErrorResponse).response.data.message)
          );
        },
      }
    );
  };

  const cancelRemoveMode = () => {
    setIsRemoveMode(false);
    setSelectedForRemoval([]);
  };

  const teacherName = classLevel?.classTeacher
    ? `${classLevel.classTeacher.firstName} ${classLevel.classTeacher.lastName}`
    : "—";

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!classLevel) {
    return (
      <div className="px-0.5 text-gray-600">
        Class not found.{" "}
        <button
          type="button"
          onClick={() => router.push("/admin/classes")}
          className="text-purple-600 underline cursor-pointer"
        >
          Back to Classes
        </button>
      </div>
    );
  }

  return (
    <div className="px-0.5 pb-8">
      <button
        type="button"
        onClick={() => router.push("/admin/classes")}
        className="flex items-center gap-2 text-purple-600 hover:text-purple-800 cursor-pointer mb-6 transition-colors font-extrabold"
      >
        <IconArrowLeft size={20} />
        <span>Back to Classes</span>
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">
            {classLevel.name}
          </h1>
        </div>
        <CustomButton
          variant="outline"
          text="Edit Class"
          icon={<IconEdit size={18} />}
          onClick={openEditDialog}
        />
      </div>

      {classLevel.description && (
        <p className="text-sm text-gray-500 mb-6">{classLevel.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#F3E8FF", color: "#7C3AED" }}
          >
            <IconUserStar size={22} stroke={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Class Teacher</p>
            <p className="text-base font-semibold text-gray-900 mt-0.5">
              {teacherName}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#F3E8FF", color: "#7C3AED" }}
          >
            <IconSchool size={22} stroke={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Students</p>
            <p className="text-base font-semibold text-gray-900 mt-0.5">
              {enrolledStudents.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {enrolledStudents.length}{" "}
          {enrolledStudents.length === 1 ? "student" : "students"} enrolled
        </p>

        {isRemoveMode ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">
              {selectedForRemoval.length} selected
            </span>
            <button
              type="button"
              onClick={cancelRemoveMode}
              className="text-sm text-gray-700 cursor-pointer hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRemoveStudents}
              disabled={selectedForRemoval.length === 0 || pendingEdit}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <IconTrash size={16} />
              Remove ({selectedForRemoval.length})
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <CustomButton
              variant="outline"
              text="Remove Students"
              icon={<IconTrash size={18} />}
              onClick={() => setIsRemoveMode(true)}
              disabled={enrolledStudents.length === 0}
            />
            <CustomButton
              text="Add Students"
              icon={<IconUserPlus size={18} />}
              onClick={() => setIsAddDialogOpen(true)}
            />
          </div>
        )}
      </div>

      <ClassEnrolledStudentsTable
        students={enrolledStudents}
        isRemoveMode={isRemoveMode}
        selectedIds={selectedForRemoval}
        onSelectionChange={setSelectedForRemoval}
      />

      <AddStudentsDialog
        isOpen={isAddDialogOpen}
        classId={id}
        enrolledStudentIds={enrolledStudents.map((s) => s.id)}
        busy={pendingEdit}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddStudents}
      />

      <EditClassDialog
        isOpen={isEditDialogOpen}
        busy={pendingEdit}
        name={classLevelName}
        description={classLevelDescription}
        classTeacherId={selectedTeacher}
        teacherOptions={teacherOptions}
        onNameChange={setClassLevelName}
        onDescriptionChange={setClassLevelDescription}
        onTeacherChange={setSelectedTeacher}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleEditClass}
      />
    </div>
  );
};

export default ClassDetailPage;
