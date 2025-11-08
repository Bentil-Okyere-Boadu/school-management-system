"use client";
import { ErrorResponse, Student } from "@/@types";
import { Menu } from "@mantine/core";
import {
  IconArchiveFilled,
  IconDots,
  IconEyeFilled,
  IconSend,
  IconTrashFilled,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { HashLoader } from "react-spinners";
import { Dialog } from "@/components/common/Dialog";
import { useArchiveUser } from "@/hooks/school-admin";
import { toast } from "react-toastify";

interface StudentsTableProps {
  students: Student[];
  refetch?: () => void;
  busy?: boolean;
}
const StudentsTable = ({ students, refetch, busy }: StudentsTableProps) => {
  const router = useRouter()
  const [isConfirmArchiveDialogOpen, setIsConfirmArchiveDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student>({} as Student);

  const { mutate: archiveMutate, isPending } = useArchiveUser({
    id: selectedStudent?.id,
    archiveState: !selectedStudent?.isArchived,
  });

  const onArchiveStudentMenuItemClick = (student: Student) => {
    setSelectedStudent(student);
    setIsConfirmArchiveDialogOpen(true);
  };

  const handleArchiveStudent = () => {
    archiveMutate(null as unknown as void, {
      onSuccess: () => {
        toast.success(selectedStudent.isArchived ? "Unarchived successfully." : "Archived successfully.");
        setIsConfirmArchiveDialogOpen(false);
        refetch?.();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  };
  return (
    <section className="bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[150px]">
                <div>ID</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                <div>First Name</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                <div>Last Name</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                <div>Other Names</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[100px]">
                <div>Class/Grade</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                <div>Date of Birth</div>
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[50px]"></th>
            </tr>
          </thead>
<tbody>
  {(() => {
    if (busy) {
      return (
        <tr>
          <td colSpan={8}>
            <div className="relative py-16">
              <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
                <HashLoader color="#AB58E7" size={40} />
              </div>
            </div>
          </td>
        </tr>
      );
    }

    if (!students?.length) {
      return (
        <tr>
          <td colSpan={8}>
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm text-gray-400 mt-1">
                Once students are added, they will appear in this table.
              </p>
            </div>
          </td>
        </tr>
      );
    }

    // Default: render rows
    return students.map((student: Student) => (
      <tr key={student.id}>
        <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
          {student.studentId}
        </td>

        <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
          {student.firstName}
        </td>

        <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
          {student.lastName}
        </td>

        <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
          {student.profile?.otherName}
        </td>

        <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
          {student.classLevels[0]?.name}
        </td>

        <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
          {student.profile?.DateOfBirth}
        </td>

        <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
          <div className="flex items-center justify-end pr-6">
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <IconDots className="cursor-pointer" />
              </Menu.Target>
              <Menu.Dropdown className="!-ml-12 !-mt-2">
                <Menu.Item
                  leftSection={<IconEyeFilled size={18} color="#AB58E7" />}
                  onClick={() => router.push(`/admin/students/${student.id}`)}
                >
                  Full View
                </Menu.Item>
                {/* <Menu.Item
                  leftSection={<IconSend size={18} color="#AB58E7" />}
                >
                  Transfer Records
                </Menu.Item> */}
                <Menu.Item
                  onClick={() => onArchiveStudentMenuItemClick(student)}
                  leftSection={<IconArchiveFilled size={18} color="#AB58E7" />}
                >
                  {student.isArchived ? 'Unarchive Student' : 'Archive Student'}
                </Menu.Item>
                {/* <Menu.Item
                  leftSection={<IconTrashFilled size={18} color="#AB58E7" />}
                >
                  Delete Records
                </Menu.Item> */}
              </Menu.Dropdown>
            </Menu>
          </div>
        </td>
      </tr>
    ));
  })()}
</tbody>

        </table>
      </div>
      <Dialog 
        isOpen={isConfirmArchiveDialogOpen}
        busy={isPending}
        dialogTitle={selectedStudent?.isArchived ? "Confirm Unarchive" : "Confirm Archive"}
        saveButtonText={selectedStudent?.isArchived ? "Unarchive Student" : "Archive Student"}
        onClose={() => setIsConfirmArchiveDialogOpen(false)} 
        onSave={() => handleArchiveStudent()}
      >
        <div className="my-3 flex flex-col gap-4">
          <p>
            {selectedStudent?.isArchived ? 
              'Are you sure you want to unarchive this student? Their account will be activated, and their data will be restored.'
              :
              'Are you sure you want to archive this student? Their account will be deactivated, but their data will be kept.'
            }
          </p>
        </div>
      </Dialog>
    </section>
  );
};

export default StudentsTable;
