"use client";
import React, { useState } from 'react'
import { ClassCard } from '@/components/admin/classes/ClassCard';
import CustomButton from '@/components/Button';
import { Dialog } from '@/components/common/Dialog';
import { SearchBar } from '@/components/common/SearchBar';
import InputField from '@/components/InputField';
import NoAvailableEmptyState from '@/components/common/NoAvailableEmptyState';
import { ErrorResponse, ClassLevel, User } from "@/@types";
import { useCreateClassLevel, useDeleteClassLevel, useEditClassLevel, useGetClassLevels, useGetSchoolUsers } from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { Select } from '@mantine/core';
import { useDebouncer } from '@/hooks/generalHooks';
import StudentSelectionTable from '@/components/admin/classes/StudentSelectionTable';


const ClassesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const [isConfirmDeleteClassLevelDialogOpen, setIsConfirmDeleteClassLevelDialogOpen] = useState(false);
  const [isClassLevelDialogOpen, setIsClassLevelDialogOpen] = useState(false);
  const [classLevelName, setClassLevelName] = useState('');
  const [classLevelDescription, setClassLevelDescription] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [classLevelId, setClassLevelId] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const { classLevels, refetch } = useGetClassLevels(useDebouncer(searchQuery));
  const { mutate: editMutation, isPending: pendingEdit } = useEditClassLevel(classLevelId);
  const { mutate: deleteMutation, isPending: pendingDelete } = useDeleteClassLevel();
  const { mutate: createMutation, isPending: pendingCreate } = useCreateClassLevel();

  const { paginationValues: paginatedTeacherValues, schoolUsers: schoolTeachers } = useGetSchoolUsers(
    currentPage,
    "",
    "",
    "",
    "Teacher",
    500
  );

  const allTeacherOptions = schoolTeachers?.map((teacher: User) => ({
    value: teacher.id,
    label: `${teacher.firstName} ${teacher.lastName}`,
  }));

  const { paginationValues: paginatedStudentValues, schoolUsers: schoolStudents } = useGetSchoolUsers(
    currentPage,
    "",
    "",
    "",
    "Student",
    500
  );

  console.log(paginatedStudentValues, paginatedTeacherValues);


  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const onEditClassLevelClick = (data: Partial<ClassLevel>) => {
    setEditMode(true);
    setClassLevelId(data.id as string);
    setIsClassLevelDialogOpen(true);
    setClassLevelName(data.name as string);
    setClassLevelDescription(data.description as string);
    setSelectedTeacher(data.teachers?.[0]?.id || '');

    const students = (data.students) as User[];
    setSelectedStudents(students?.map((item) => item.id) || []);
  }

  const editClassLevel = () => {
    editMutation(
      { name: classLevelName, 
        description: classLevelDescription,
        teacherIds: selectedTeacher ? [selectedTeacher] : [], 
        studentIds: selectedStudents
      }, {
      onSuccess: () => {
        toast.success('Successfully updated class.')
        setIsClassLevelDialogOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      }
    })
  }

  const createClassLevel = () => {
    createMutation(
      { 
        name: classLevelName, 
        description: classLevelDescription, 
        teacherIds: selectedTeacher ? [selectedTeacher] : [], 
        studentIds: selectedStudents
      }, {
      onSuccess: () => {
        toast.success('Successfully created class.')
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
    setSelectedTeacher('');
    setSelectedStudents([]);
  }

  const handleTeacherChange = (event: string) => {
    setSelectedTeacher(event);
  };

  return (
    <>
      <div className="pb-8">
        <div className="flex justify-between items-center flex-wrap gap-4 w-full mb-5 px-0.5">
          <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />
          <CustomButton text="Add Class" onClick={onAddNewClassLevel} />
        </div>
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 py-6 px-0.5">
          {classLevels?.map((data, index) => (
            <ClassCard
              key={index + "12"}
              showEditAndDelete={true}
              classData={data}
              studentCount={data?.students?.length}
              onEditClick={() => onEditClassLevelClick(data)}
              onDeleteClick={() =>  onDeleteButtonClick(data.id)}
            />
          ))}
        </section>
            {
              classLevels.length === 0 && (
                  <NoAvailableEmptyState message="No class available, click ‘Add Class to create one." />
                )
            }
      </div>

      {/* Creating/Editing Class Dialog */}
      <Dialog 
        isOpen={isClassLevelDialogOpen}
        busy={editMode? pendingEdit : pendingCreate}
        dialogTitle={`${editMode ? 'Edit' : 'Add New'} Class`}
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
          <Select
            label="Teacher"
            placeholder="Pick teacher"
            data={allTeacherOptions || []}
            value={selectedTeacher}
            onChange={(e) => handleTeacherChange(e as string)}
            searchable
          />
          <div>
            <p className="text-xs text-[#52525c] mb-1">Students</p>
            <StudentSelectionTable
              students={schoolStudents}
              selectedStudents={selectedStudents}
              onChange={setSelectedStudents}
            /> 
          </div>

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
            Are you sure you want to delete this class? You will loose all related information
          </p>
        </div>
      </Dialog>
    </>
  );
}

export default ClassesPage