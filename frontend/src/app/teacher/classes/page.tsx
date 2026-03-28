"use client";

import React, { useEffect, useMemo, useState } from 'react'
import { ClassCard } from '@/components/admin/classes/ClassCard';
import { SearchBar } from '@/components/common/SearchBar';
import NoAvailableEmptyState from '@/components/common/NoAvailableEmptyState';
import { ClassLevel, MissingGrade, ErrorResponse, NotificationType } from "@/@types";
import { useGetTeacherClasses, useApproveClassResults, useTeacherGetMe, useGetCalendars } from "@/hooks/teacher";
import { useDebouncer } from '@/hooks/generalHooks';
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/common/Dialog";
import { toast } from "react-toastify";
import { useCreateNotification } from '@/hooks/school-admin';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Combobox, Select } from '@mantine/core';
import { getSortedSchoolTerms } from '@/utils/schoolTerms';


const ClassesPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const { me } = useTeacherGetMe();
  const { studentCalendars } = useGetCalendars();

  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(studentCalendars ?? []),
    [studentCalendars]
  );

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
        const cal = studentCalendars?.find((c) =>
          c.terms?.some((term) => term.id === t.id)
        );
        const label = cal ? `${t.termName} — ${cal.name}` : t.termName;
        return { value: t.id, label };
      }),
    [sortedTerms, studentCalendars]
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

  const { classLevels, refetch: refetchTeacherClasses } = useGetTeacherClasses(
    useDebouncer(searchQuery),
    selectedTermId ?? undefined
  );

  const [isMissingGradesDialogOpen, setIsMissingGradesDialogOpen] = useState(false);
  const [missingGrades, setMissingGrades] = useState<MissingGrade[]>();
  const [selectedClass, setSelectedClass] = useState<ClassLevel | null>(null);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);

  const { mutate: approveResults, isPending: approveResultPending } = useApproveClassResults();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const onNavigateToAttendance = (data: ClassLevel) => {
    router.push(`/teacher/classes/${data.id}/attendance`)
  }

  const onApproveOrDisApproveClassResult = (classData: ClassLevel) => {
    if(classData?.isApproved || classData?.schoolAdminApproved) {
      onDisApproveClassResult(classData)
    } else {
      onApproveClassResult(classData)
    }
  }

  const onApproveClassResult = (classData: ClassLevel) => {
    if(approveResultPending) return;
    
    setSelectedClass(classData);
    setBusyCardId(classData.id);

    const payload = {
      classLevelId: classData?.id,
      action: "approve" as const,
      forceApprove: false,
      academicTermId: selectedTermId ?? undefined,
    };
    
    approveResults(payload, {
      onSuccess: (data) => {
        if(data?.data?.missingGrades?.length > 0) {
          setMissingGrades(data?.data?.missingGrades);
          setIsMissingGradesDialogOpen(true);
          setBusyCardId(null);
        } else {
          // no missing subject scores
          onConfirmClassResultApproval(classData);
        }
      },
      onError: (error: unknown) => {
        setBusyCardId(null);
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  }

    const {mutate: createNotification} = useCreateNotification();
  
    const createNotificationForAdmission = (data: ClassLevel) => {
        createNotification({
          title: "Class Results submitted",
          message: `Results for ${data.name} have been submitted.`,
          type: NotificationType.Results,
          schoolId: me.school.id as string,
        }, {
          onError: (error: unknown) => {
            console.error("Failed to create notification:", error);
          },
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'myClassLevels'] });
          }
        });
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
        refetchTeacherClasses().finally(() => {
          setBusyCardId(null);
          toast.success("Class results submitted successfully");
          createNotificationForAdmission(classData as ClassLevel);
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
          refetchTeacherClasses().finally(() => {
            setBusyCardId(null);
            toast.success("Class results unsubmitted successfully");
          });
        },
        onError: (error: unknown) => {
          setBusyCardId(null);
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    }

  return (
    <div className="pb-8">
       <div className="flex justify-between items-end mb-6 flex-wrap gap-4">
        <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />
          <div className="w-full max-w-[320px] min-w-[200px]">
          <Select
            label="Academic term"
            placeholder="Select term"
            data={termSelectData}
            value={selectedTermId}
            onChange={(v) => setSelectedTermId(v)}
            searchable
            disabled={sortedTerms.length === 0}
            className="w-full"
            rightSection={termSelectRightSection}
            rightSectionWidth={showLatestInSelect ? 118 : undefined}
            styles={{
              input: {
                borderColor: "var(--mantine-color-gray-3)",
              },
            }}
          />
        </div>
      </div>
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 py-6 px-0.5">
        {classLevels?.map((data, index) => (
          <ClassCard
            key={index + "12"}
            classData={data}
            studentCount={data?.studentCount}
            showGoToAttendance={true}
            showApproval={true}
            isApproved={data?.isApproved}
            approvalText={data?.isApproved ? 'Unsubmit Results' : 'Submit Results'}
            onNavigateToAttendanceClick={onNavigateToAttendance}
            onApprovalClick={() => onApproveOrDisApproveClassResult(data)}
            busy={busyCardId === data.id}
          />
        ))}
      </section>
      {
        classLevels.length === 0 && (
            <NoAvailableEmptyState message="No class available" />
          )
      }


      {/* Missing Grades Dialog */}
      <Dialog 
        isOpen={isMissingGradesDialogOpen}
        busy={approveResultPending}
        dialogTitle="Missing Grades"
        subheader="Some students have missing grades. Submission not completed."
        saveButtonText="Confirm Submission"
        onSave={() => {onConfirmClassResultApproval(selectedClass as ClassLevel)}} 
        onClose={() => setIsMissingGradesDialogOpen(false)}
      >
        <div className="my-3">
          <ol className="relative border-l border-gray-200">
            {missingGrades?.map((item) => (
              <li key={item.student.id} className="mb-10 ml-4">
                {/* Student marker */}
                <div className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#AB58E7] ring-4 ring-white"></div>

                {/* Student info */}
                <h3 className="text-base font-semibold text-gray-900">
                  {item.student.firstName} {item.student.lastName}
                </h3>
                <p className="mb-2 text-sm text-gray-500">
                  {item.missingSubjects.length} missing subject score
                  {item.missingSubjects.length > 1 ? "s" : ""}
                </p>

                {/* Subject badges */}
                <div className="flex flex-wrap gap-2">
                  {item.missingSubjects.map((subject) => (
                    <span
                      key={subject.subjectId}
                      className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1 text-sm"
                    >
                      <span className="font-medium">{subject.subjectName}</span>
                      <span className="text-xs text-gray-500">
                        {subject.teacher.firstName} {subject.teacher.lastName}
                      </span>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Dialog>
    </div>
  );
}

export default ClassesPage;