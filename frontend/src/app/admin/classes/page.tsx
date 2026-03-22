"use client";
import React, { useEffect, useMemo, useState } from 'react'
import { AdminClassResultsCard } from '@/components/admin/classes/AdminClassResultsCard';
import CustomButton from '@/components/Button';
import { Dialog } from '@/components/common/Dialog';
import { SearchBar } from '@/components/common/SearchBar';
import InputField from '@/components/InputField';
import NoAvailableEmptyState from '@/components/common/NoAvailableEmptyState';
import { ErrorResponse, ClassLevel, User } from "@/@types";
import { useAdminApproveClassResults, useCreateClassLevel, useDeleteClassLevel, useEditClassLevel, useGetCalendars, useGetClassLevels, useGetMe, useGetSchoolUsers, useGetStudentsForClassAssignment } from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { Badge, Combobox, Select } from '@mantine/core';
import { useDebouncer } from '@/hooks/generalHooks';
import StudentSelectionTable from '@/components/admin/classes/StudentSelectionTable';
import { getSortedSchoolTerms } from '@/utils/schoolTerms';
import { IconLock, IconLockOpen, IconSchool } from '@tabler/icons-react';


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

  const [isMissingGradesDialogOpen, setIsMissingGradesDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassLevel | null>(null);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { mutate: approveResults, mutateAsync: approveResultsAsync, isPending: approveResultPending } = useAdminApproveClassResults();

  const { calendars } = useGetCalendars();
  const { me: schoolAdminMe } = useGetMe();
  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(calendars),
    [calendars]
  );
  const schoolName = schoolAdminMe?.school?.name;

  useEffect(() => {
    if (sortedTerms.length === 0) return;
    setSelectedTermId((prev) => {
      if (prev && sortedTerms.some((t) => t.id === prev)) return prev;
      return sortedTerms[0].id;
    });
  }, [sortedTerms]);

  const latestTermId = sortedTerms[0]?.id;
  const termSelectData = useMemo(
    () =>
      sortedTerms.map((t) => {
        const cal = calendars.find((c) =>
          c.terms?.some((term) => term.id === t.id)
        );
        const label = cal ? `${t.termName} — ${cal.name}` : t.termName;
        return { value: t.id, label };
      }),
    [sortedTerms, calendars]
  );

  const showLatestInSelect = Boolean(
    latestTermId && selectedTermId === latestTermId
  );

  const termSelectRightSection = useMemo(
    () => (
      <div className="flex items-center justify-end gap-1.5 pr-0.5">
        {showLatestInSelect && (
          <Badge
            variant="light"
            size="xs"
            className="shrink-0 font-semibold"
            style={{ backgroundColor: "#F3E8FF", color: "#6B21A8" }}
          >
            Latest
          </Badge>
        )}
        <Combobox.Chevron size="sm" />
      </div>
    ),
    [showLatestInSelect]
  );

  const { classLevels, refetch } = useGetClassLevels(
    useDebouncer(searchQuery),
    selectedTermId ?? undefined
  );

  const lockedCount = useMemo(
    () => classLevels.filter((c) => c.schoolAdminApproved).length,
    [classLevels]
  );
  const unlockedCount = useMemo(
    () => classLevels.filter((c) => !c.schoolAdminApproved).length,
    [classLevels]
  );
  const { mutate: editMutation, isPending: pendingEdit } = useEditClassLevel(classLevelId);
  const { mutate: deleteMutation, isPending: pendingDelete } = useDeleteClassLevel();
  const { mutate: createMutation, isPending: pendingCreate } = useCreateClassLevel();
  const { schoolUsers: schoolTeachers } = useGetSchoolUsers(
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
  

  const { students: schoolStudents } = useGetStudentsForClassAssignment(
    "",
    true, // Only get students without classes (or in the current class if editing)
    editMode && classLevelId ? classLevelId : undefined // When editing, include students already in this class
  );

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
    setSelectedTeacher(data.classTeacher?.id || '');

    const students = (data.students) as User[];
    setSelectedStudents(students?.map((item) => item.id) || []);
  }

  const editClassLevel = () => {
    editMutation(
      { name: classLevelName, 
        description: classLevelDescription,
        // teacherIds: selectedTeacher ? [selectedTeacher] : [],
        classTeacherId: selectedTeacher,
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
        // teacherIds: selectedTeacher ? [selectedTeacher] : [], 
        classTeacherId: selectedTeacher,
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

  const onApproveOrDisApproveClassResult = (classData: ClassLevel) => {
    if(classData?.schoolAdminApproved) {
      onDisApproveClassResult(classData)
    } else {
      onApproveClassResult(classData)
    }
  }

  const onApproveClassResult = (classData: ClassLevel) => {
    if(approveResultPending) return;

    setBusyCardId(classData.id);
    setSelectedClass(classData);

    if(classData.isApproved){
      const payload = {
        classLevelId: classData?.id,
        action: "approve" as const,
        forceApprove: true,
        academicTermId: selectedTermId ?? undefined,
      };

      approveResults(payload, {
        onSuccess: () => {
          refetch().finally(() => {
            setBusyCardId(null);
            toast.success('Class results locked successfully');
          });
        },
        onError: (error: unknown) => {
          setBusyCardId(null);
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    } else {
      setIsMissingGradesDialogOpen(true);
      setBusyCardId(null);
    }
  }

  const onConfirmClassResultApproval = (classData?: ClassLevel) => {
    const activeId = classData?.id || (selectedClass?.id as string);
    setBusyCardId(activeId); 

    const payload = {
      classLevelId: classData?.id || selectedClass?.id as string,
      action: "approve" as const,
      forceApprove: true,
      academicTermId: selectedTermId ?? undefined,
    };

    approveResults(payload, {
      onSuccess: () => {
      setIsMissingGradesDialogOpen(false);
      refetch().finally(() => {
        setBusyCardId(null);
        toast.success('Class results locked successfully');
      });
      },
      onError: (error: unknown) => {
        setBusyCardId(null);
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  }

  const onDisApproveClassResult = (classData?: ClassLevel) => {
    if(approveResultPending) return;
    
    setSelectedClass(classData as ClassLevel);
    setBusyCardId(classData?.id as string);

    const payload = {
      classLevelId: classData?.id as string,
      action: "unapprove" as const,
      forceApprove: true,
      academicTermId: selectedTermId ?? undefined,
    };

    approveResults(payload, {
      onSuccess: () => {
      refetch().finally(() => {
        setBusyCardId(null);
        toast.success('Class results unlocked successfully');
      });
      },
      onError: (error: unknown) => {
        setBusyCardId(null);
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  }

  const handleUnlockAll = async () => {
    if (!selectedTermId || approveResultPending || bulkBusy || lockedCount === 0)
      return;
    const targets = classLevels.filter((c) => c.schoolAdminApproved);
    setBulkBusy(true);
    try {
      for (const c of targets) {
        await approveResultsAsync({
          classLevelId: c.id,
          action: "unapprove",
          forceApprove: true,
          academicTermId: selectedTermId,
        });
      }
      toast.success("Unlocked all classes for this term");
      await refetch();
    } catch (error: unknown) {
      toast.error(
        JSON.stringify(
          (error as ErrorResponse)?.response?.data?.message ?? "Bulk unlock failed"
        )
      );
    } finally {
      setBulkBusy(false);
    }
  };

  const handleLockAll = async () => {
    if (!selectedTermId || approveResultPending || bulkBusy || unlockedCount === 0)
      return;
    const targets = classLevels.filter((c) => !c.schoolAdminApproved);
    setBulkBusy(true);
    try {
      for (const c of targets) {
        await approveResultsAsync({
          classLevelId: c.id,
          action: "approve",
          forceApprove: true,
          academicTermId: selectedTermId,
        });
      }
      toast.success("Locked all classes for this term");
      await refetch();
    } catch (error: unknown) {
      toast.error(
        JSON.stringify(
          (error as ErrorResponse)?.response?.data?.message ?? "Bulk lock failed"
        )
      );
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <>
      <div className="pb-8">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-5 px-0.5">
          <SearchBar
            onSearch={handleSearch}
            className="w-[366px] max-md:w-full"
          />
          <CustomButton text="Add Class" onClick={onAddNewClassLevel} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 px-0.5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#F3E8FF", color: "#7C3AED" }}
            >
              <IconSchool size={22} stroke={1.75} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                {classLevels.length}
              </p>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Total classes
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <IconLockOpen size={22} stroke={1.75} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                {unlockedCount}
              </p>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Unlocked
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <IconLock size={22} stroke={1.75} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                {lockedCount}
              </p>
              <p className="text-xs font-medium text-gray-500 mt-1">Locked</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6 px-0.5">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:justify-between">
            <div className="w-full max-w-[320px] min-w-[200px]">
              <Select
                label="Select term"
                placeholder="Select term"
                data={termSelectData}
                value={selectedTermId}
                onChange={(v) => setSelectedTermId(v)}
                searchable
                disabled={sortedTerms.length === 0}
                className="w-full"
                rightSection={termSelectRightSection}
                rightSectionWidth={showLatestInSelect ? 118 : undefined}
              />
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                onClick={handleUnlockAll}
                disabled={
                  lockedCount === 0 ||
                  approveResultPending ||
                  bulkBusy ||
                  !selectedTermId
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2
                 border-emerald-400 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800
                  hover:bg-emerald-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <IconLockOpen size={18} />
                Unlock all ({lockedCount})
              </button>
              <button
                type="button"
                onClick={handleLockAll}
                disabled={
                  unlockedCount === 0 ||
                  approveResultPending ||
                  bulkBusy ||
                  !selectedTermId
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-400 bg-white px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <IconLock size={18} />
                Lock all ({unlockedCount})
              </button>
            </div>
          </div>
        </div>

        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 py-2 px-0.5">
          {classLevels?.map((data, index) => (
            <AdminClassResultsCard
              key={data.id ?? index}
              classData={data}
              studentCount={data?.students?.length ?? 0}
              isAdminLocked={!!data?.schoolAdminApproved}
              teacherSubmitted={!!data?.isApproved}
              onLockToggle={onApproveOrDisApproveClassResult}
              onEditClick={() => onEditClassLevelClick(data)}
              onDeleteClick={() => onDeleteButtonClick(data.id)}
              lockTooltip={
                data?.schoolAdminApproved
                  ? "Unlock to allow teachers to edit and resubmit results for this term."
                  : "Lock to finalize results and prevent further changes for this term."
              }
              busy={busyCardId === data.id || bulkBusy}
            />
          ))}
        </section>
        {classLevels.length === 0 && (
          <NoAvailableEmptyState message="No class available — add a class to get started." />
        )}
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
            label="Class Teacher"
            placeholder="Pick teacher"
            data={allTeacherOptions || []}
            value={selectedTeacher}
            onChange={(e) => handleTeacherChange(e as string)}
            searchable
          />
          <div>
            <p className="text-xs text-[#52525c] mb-1">Students</p>
            <StudentSelectionTable
              students={schoolStudents || []}
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


      {/* Class Results Approval Dialog */}
      <Dialog 
        isOpen={isMissingGradesDialogOpen}
        busy={approveResultPending}
        dialogTitle="Class Results Locking"
        subheader=""
        saveButtonText="Confirm"
        onSave={() => {onConfirmClassResultApproval(selectedClass as ClassLevel)}} 
        onClose={() => setIsMissingGradesDialogOpen(false)}
      >
        <div className="my-3">
            <p>Class teacher has not submitted results yet, would you still like to proceed to lock results ?</p>
        </div>
      </Dialog>
    </>
  );
}

export default ClassesPage