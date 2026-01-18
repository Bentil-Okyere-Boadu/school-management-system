import { User } from "@/@types";
import { CustomSelectTag } from "@/components/common/CustomSelectTag";
import { Dialog } from "@/components/common/Dialog";
import {
  useAssignSubjectTeacher,
  useGetAllSubjects,
  useGetClassLevels,
  useGetSchoolUsers,
  useGetSubjectById,
  useRemoveSubjectAssignment,
  useUpdateSubjectTeacher,
} from "@/hooks/school-admin";
import { MultiSelect, Select } from "@mantine/core";
import { IconPencil, IconTrashFilled } from "@tabler/icons-react";
import React, { useState } from "react";
import { toast } from "react-toastify";

const SubjectAssignment = () => {
  const [isCreate, setIsCreate] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDropdownSubject, setSelectedDropdownSubject] = useState("");
  const [currentPage] = useState(1);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string>("");

  const { subjects } = useGetAllSubjects();
  const { classLevels } = useGetClassLevels();
  const { schoolUsers: schoolTeachers } = useGetSchoolUsers(
    currentPage,
    "",
    "",
    "",
    "Teacher",
    500
  );

  const { mutate: assignSubjectTeacher } = useAssignSubjectTeacher();
  const { mutate: updateSubjectTeacher } =
    useUpdateSubjectTeacher(assignmentId);
  const { mutate: removeAssignment } = useRemoveSubjectAssignment();

  const allTeacherOptions = schoolTeachers?.map((teacher: User) => ({
    value: teacher.id,
    label: `${teacher.firstName} ${teacher.lastName}`,
  }));

  const allClassLvlOptions = classLevels?.map((classLvl) => {
    return { value: classLvl.id, label: classLvl.name };
  });

  const { subjects: assignments, refetch } = useGetSubjectById(
    selectedDropdownSubject
  );

  const subjectOptions =
    subjects?.length > 0
      ? subjects.map((subject) => {
          return { label: subject.name, value: subject.id as string };
        })
      : [];

  subjectOptions.unshift({ label: "Select Subject", value: "" });

  const onAddNewPress = () => {
    if(selectedDropdownSubject){
      setIsCreate(true);
      setIsOpen(true);
    } else {
      toast.warn('Please select a subject to add a new subject assignment' )
    }
  };

  const onOptionFilterItemClick = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedValue = event.target.value;
    setSelectedDropdownSubject(selectedValue);
  };

  const handleClassesSelect = (value: string[]) => {
    setSelectedClasses(value);
  };

  const handleTeacherSelect = (value: string | null) => {
    setSelectedTeacher(value as string);
  };

  const onAssignTeacher = () => {
    if (isCreate) {
      assignSubjectTeacher(
        {
          teacherId: selectedTeacher,
          classLevelIds: selectedClasses,
          subjectCatalogId: selectedDropdownSubject,
        },
        {
          onSuccess: () => {
            toast.success("Teacher assigned successfully.");
            setIsOpen(false);
            setSelectedClasses([]);
            setSelectedTeacher("");
            refetch();
          },
          onError: () => {
            toast.error("An error occured while assigning teacher.");
            setIsOpen(false);
            setSelectedClasses([]);
            setSelectedTeacher("");
            refetch();
          },
        }
      );
    } else {
      updateSubjectTeacher(
        {
          teacherId: selectedTeacher,
          classLevelIds: selectedClasses,
          subjectCatalogId: selectedDropdownSubject,
        },
        {
          onSuccess: () => {
            toast.success("Assignment updated successfully.");
            setIsOpen(false);
            setSelectedClasses([]);
            setSelectedTeacher("");
            setAssignmentId("");
            refetch();
          },
          onError: () => {
            toast.error("An error occured while updating assignment.");
            setIsOpen(false);
            setSelectedClasses([]);
            setSelectedTeacher("");
            setAssignmentId("");
            refetch();
          },
        }
      );
    }
  };

  const onEditAssignmentClick = (
    teacherId: string,
    classLvlIds: string[],
    assignmentId: string
  ) => {
    setIsCreate(false);
    setSelectedTeacher(teacherId);
    setSelectedClasses(classLvlIds);
    setAssignmentId(assignmentId);
    setIsOpen(true);
  };

  const onDeleteAssignment = () => {
    removeAssignment(assignmentId, {
      onSuccess: () => {
        toast.success("Assignment removed successfully.");
        setAssignmentId("");
        setConfirmDelete(false);
        refetch();
      },
      onError: () => {
        toast.error("An error occured while assigning teacher.");
        setIsOpen(false);
        setAssignmentId("");
        setConfirmDelete(false);
        refetch();
      },
    });
  };

  return (
    <div>
      <div className="w-full flex justify-between">
        {subjects?.length > 0 ? (
          <div className="flex gap-3 mt-3">
            <CustomSelectTag
              options={subjectOptions}
              value={selectedDropdownSubject}
              onOptionItemClick={onOptionFilterItemClick}
            />
            <p
              onClick={onAddNewPress}
              className="text-purple-500 underline cursor-pointer"
            >
              Add New
            </p>
          </div>
        ) : (
          <div></div>
        )}
      </div>

      <section className="w-full p-2">
        {assignments?.length > 0 ? (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          assignments.map((assignment: any, index: React.Key | null | undefined) =>
            assignment?.subjects?.length > 0 ? (
              assignment?.subjects.map((subj: { teacher: { id: string; }; classLevels: {id: string}[]; id: string; }, index: React.Key | null | undefined) => (
                <div key={index} className="flex mt-3 w-fit gap-4 bg-white p-4">
                  <Select
                    label="Class Teacher"
                    placeholder="Select teacher"
                    data={allTeacherOptions || []}
                    value={subj.teacher.id}
                    searchable
                    disabled
                    styles={{
                      label: {
                        marginBottom: "10px"
                      }
                    }}
                  />
                  <MultiSelect
                    label="Classes"
                    data={allClassLvlOptions || []}
                    value={subj.classLevels.map(
                      (classLvl: { id: string }) => classLvl.id
                    )}
                    className="w-[500px]"
                    disabled
                  />
                  <div className="flex gap-3 justify-end items-center">
                    <IconPencil
                      size={25}
                      className="mt-5 cursor-pointer"
                      onClick={() =>
                        onEditAssignmentClick(
                          subj.teacher.id,
                          subj.classLevels.map(
                            (classLvl: { id: string }) => classLvl.id
                          ),
                          subj.id
                        )
                      }
                    />
                    <IconTrashFilled
                      size={25}
                      className="mt-5 text-red-600 cursor-pointer"
                      onClick={() => {
                        setConfirmDelete(true);
                        setAssignmentId(subj.id);
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div
                key={index}
                className="w-full flex h-[250px] flex-col items-center justify-center"
              >
                <p className="text-gray-500">
                  No subject assignment available, click &lsquo;Add New&rsquo;
                  to create one
                </p>
              </div>
            )
          )
        ) : (
          <div className="w-full flex h-[250px] flex-col items-center justify-center">
            <p className="text-gray-500">
              Select a subject to view its assignments or click &lsquo;Add
              New&rsquo; to create one
            </p>
          </div>
        )}
      </section>
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={() => onAssignTeacher()}
        dialogTitle={
          isCreate ? "Add Subject Assignment" : "Edit Subject Assignment"
        }
      >
        <div className="flex mt-4 gap-2 w-full">
          <Select
            label="Teacher"
            placeholder="Select teacher"
            data={allTeacherOptions || []}
            value={selectedTeacher}
            onChange={handleTeacherSelect}
            searchable
            styles={{
                      label: {
                        marginBottom: "10px"
                      }
                    }}
          />
          <MultiSelect
            label="Classes"
            placeholder="Select classes to assign teacher."
            data={allClassLvlOptions}
            onChange={handleClassesSelect}
            searchable
            className="w-[350px]"
            value={selectedClasses}
          />
        </div>
      </Dialog>
      <Dialog
        dialogTitle="Delete confirmation"
        saveButtonText="Delete Subject"
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onSave={() => {
          onDeleteAssignment();
        }}
      >
        <div className="mt-4">
          <p>
            Are you sure you want to delete this subject assignment? The
            assignment will be removed from the system permanently.
          </p>
        </div>
      </Dialog>
    </div>
  );
};

export default SubjectAssignment;
