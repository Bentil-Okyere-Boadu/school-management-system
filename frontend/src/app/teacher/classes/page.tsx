"use client";

import React, { useState } from 'react'
import { ClassCard } from '@/components/admin/classes/ClassCard';
import { SearchBar } from '@/components/common/SearchBar';
import NoAvailableEmptyState from '@/components/common/NoAvailableEmptyState';
import { ClassLevel, MissingGrade, ErrorResponse } from "@/@types";
import { useGetTeacherClasses, useApproveClassResults } from "@/hooks/teacher";
import { useDebouncer } from '@/hooks/generalHooks';
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/common/Dialog";
import { toast } from "react-toastify";


const ClassesPage = () => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  const { classLevels, refetch: refetchTeacherClasses } = useGetTeacherClasses(useDebouncer(searchQuery));

  const [isMissingGradesDialogOpen, setIsMissingGradesDialogOpen] = useState(false);
  const [missingGrades, setMissingGrades] = useState<MissingGrade[]>();
  const [selectedClass, setSelectedClass] = useState<ClassLevel | null>(null);

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
    const payload = {
      classLevelId: classData?.id,
      action: "approve",
      forceApprove: false,
    };
    
    approveResults(payload, {
      onSuccess: (data) => {
        if(data?.data?.missingGrades?.length > 0) {
          setMissingGrades(data?.data?.missingGrades);
          setIsMissingGradesDialogOpen(true);
        } else {
          // no missing subject scores
          onConfirmClassResultApproval(classData);
        }
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  }

  const onConfirmClassResultApproval = (classData?: ClassLevel) => {
    const payload = {
      classLevelId: classData?.id || selectedClass?.id as string,
      action: "approve",
      forceApprove: true,
    };

    approveResults(payload, {
      onSuccess: () => {
        refetchTeacherClasses();
        setIsMissingGradesDialogOpen(false);
        toast.success('Class results submitted successfully');
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  }

    const onDisApproveClassResult = (classData?: ClassLevel) => {
      if(approveResultPending) return;
      
      setSelectedClass(classData as ClassLevel);
      const payload = {
        classLevelId: classData?.id as string,
        action: "unapprove",
        forceApprove: true,
      };
  
      approveResults(payload, {
        onSuccess: () => {
          refetchTeacherClasses();
          toast.success('Class results unsubmitted successfully');
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    }

  return (
    <div className="pb-8">
      <div className="flex justify-between items-center flex-wrap gap-4 w-full mb-5 px-0.5">
        <SearchBar onSearch={handleSearch} className="w-[366px] max-md:w-full" />
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
            approvalText={data?.isApproved ? 'Unsubmit Result' : 'Submit Result'}
            onNavigateToAttendanceClick={onNavigateToAttendance}
            onApprovalClick={() => onApproveOrDisApproveClassResult(data)}
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
        busy={false}
        dialogTitle="Missing Grades"
        subheader="Some students have missing grades. Approval not completed."
        saveButtonText="Confirm"
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