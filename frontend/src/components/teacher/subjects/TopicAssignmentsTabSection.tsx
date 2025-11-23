"use client";
import React, { useState } from "react";
import { Dialog } from "@/components/common/Dialog";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import { SearchBar } from "@/components/common/SearchBar";
import { Menu, Select, Switch } from "@mantine/core";
import { IconDots, IconEdit, IconTrashFilled } from "@tabler/icons-react";
import { Topic, Assignment, ErrorResponse } from "@/@types";
import { useGetTeacherTopics, useGetTeacherAssignments, useCreateTeacherAssignment, useUpdateTeacherAssignment, useDeleteTeacherAssignment, useGetTeacherSubjectClasses } from "@/hooks/teacher";
import { toast } from "react-toastify";
import { HashLoader } from "react-spinners";


export const TopicAssignmentsTabSection: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isCreate, setIsCreate] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [assignment, setAssignment] = useState<Partial<Assignment> & { classLevelId?: string }>({
    id: "",
    title: "",
    topicId: "",
    classLevelId: "",
    instructions: "",
    dueDate: "",
    maxScore: 100,
    status: "draft",
    isPublished: false,
  });

  const { teacherTopics: topics } = useGetTeacherTopics("");
  const { classSubjects } = useGetTeacherSubjectClasses("");
  const { teacherAssignments: assignments, isLoading, refetch } = useGetTeacherAssignments(searchQuery);
  const { mutate: createAssignment, isPending: creating } = useCreateTeacherAssignment();
  const { mutate: updateAssignment, isPending: updating } = useUpdateTeacherAssignment(assignment?.id || "");
  const { mutate: deleteAssignment, isPending: deleting } = useDeleteTeacherAssignment();

  const topicOptions =
    topics?.map((topic: Topic) => ({
      value: topic.id,
      label: topic.name,
    })) ?? [];

  const classOptions =
    classSubjects?.map((item: { classLevel: { id: string; name: string } }) => ({
      value: item.classLevel.id,
      label: item.classLevel.name,
    })) ?? [];

  const onOpenCreate = () => {
    setIsCreate(true);
    setAssignment({
      id: "",
      title: "",
      topicId: "",
      classLevelId: "",
      instructions: "",
      dueDate: "",
      maxScore: 100,
      status: "draft",
      isPublished: false,
    });
    setIsDialogOpen(true);
  };

  const onOpenEdit = (row: Assignment) => {
    setIsCreate(false);
    setAssignment({
      id: row.id,
      title: row.title,
      topicId: row.topicId,
      instructions: row.instructions,
      dueDate: formatDateForInput(row.dueDate),
      maxScore: row.maxScore,
      status: row.status,
      isPublished: row.status === 'published',
      classLevelId: row.classLevelId,
    });
    setIsDialogOpen(true);
  };

  const onAskDelete = (row: Assignment) => {
    setAssignment({
      id: row.id,
      title: row.title,
    });
    setIsConfirmDeleteOpen(true);
  };

  const saveAssignment = () => {
    if (isCreate) {
      const payload = {
        topicId: assignment.topicId || "",
        classLevelId: assignment.classLevelId || "",
        title: assignment.title || "",
        instructions: assignment.instructions || "",
        dueDate: assignment.dueDate || "",
        maxScore: assignment.maxScore || 100,
        state: assignment.isPublished ? "published" : "draft",
      };
      
      createAssignment(payload, {
        onSuccess: () => {
          toast.success("Assignment created successfully");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    } else {
      const payload = {
        title: assignment.title || "",
        instructions: assignment.instructions || "",
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        state: assignment.isPublished ? "published" : "draft",
      };
      
      updateAssignment(payload, {
        onSuccess: () => {
          toast.success("Assignment updated successfully");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    }
  };

  const confirmDelete = () => {
    deleteAssignment(assignment.id as string, {
      onSuccess: () => {
        toast.success("Assignment deleted successfully");
        setIsConfirmDeleteOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Convert ISO date to yyyy-MM-dd format for date input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    return status === "published"
      ? "bg-purple-200 text-purple-700"
      : "bg-gray-200 text-gray-500";
  };

  return (
    <>
      <div className="pb-8">

        <div className="w-full flex justify-between mb-4">
          {false  ? (        
            <SearchBar
              placeholder="Search assignments..."
              onSearch={handleSearch}
              className="w-full max-w-md"
            />
          ) : (
            <div></div>
          )}
          <CustomButton text="Create Assignment" onClick={onOpenCreate} />
        </div>

        <section className="bg-white mt-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                    <div>Assignment Title</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                    <div>Topic</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                    <div>Due Date</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                    <div>Status</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                    <div>Submissions</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                    <div>Max Score</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (isLoading) {
                    return (
                      <tr>
                        <td colSpan={7}>
                          <div className="relative py-20 bg-white">
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                              <HashLoader color="#AB58E7" size={40} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (!assignments?.length) {
                    return (
                      <tr>
                        <td colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <p className="text-lg font-medium">No assignments created</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Created assignments will appear here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return assignments.map((row: Assignment) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row.title}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row.topic || "-"}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div className="flex items-center gap-2">
                          {formatDate(row.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>
                          {row.submissions || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row.maxScore}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div className="flex items-center justify-end pr-6">
                          <Menu shadow="md" width={200}>
                            <Menu.Target>
                              <IconDots className="cursor-pointer" />
                            </Menu.Target>
                            <Menu.Dropdown className="!-ml-12 !-mt-2">
                              <Menu.Item
                                onClick={() => onOpenEdit(row)}
                                leftSection={<IconEdit size={18} color="#AB58E7" />}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => onAskDelete(row)}
                                leftSection={<IconTrashFilled size={18} color="red" />}
                              >
                                Delete
                              </Menu.Item>
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
        </section>
      </div>

      <Dialog
        isOpen={isDialogOpen}
        busy={isCreate ? creating : updating}
        dialogTitle={isCreate ? "Create Assignment" : "Edit Assignment"}
        onClose={() => setIsDialogOpen(false)}
        onSave={saveAssignment}
        saveButtonText={isCreate ? "Create Assignment" : "Update Assignment"}
      >
        <form className="mt-3">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Select
              label="Topic"
              placeholder="Select a topic"
              data={topicOptions}
              value={assignment.topicId}
              onChange={(v) => setAssignment({ ...assignment, topicId: v || "" })}
              searchable
              required
              disabled={!isCreate}
            />
            <Select
              label="Class Level"
              placeholder="Select a class"
              data={classOptions}
              value={assignment.classLevelId}
              onChange={(v) => setAssignment({ ...assignment, classLevelId: v || "" })}
              searchable
              required
              disabled={!isCreate}
            />
          </div>

          <InputField
            className="!py-0"
            label="Assignment Title"
            min={1}
            placeholder="e.g., Algebra Problem Set 1"
            onChange={(e) => setAssignment({ ...assignment, title: e.target.value })}
            value={assignment.title || ""}
            required
          />

          <div className="mb-4">
            <label htmlFor="instructions" className="mb-1.5 text-xs text-zinc-600 block">
              Instructions
            </label>
            <textarea
              id="instructions"
              className="px-3 py-2.5 h-24 rounded border-solid border-[0.5px] border-zinc-500 text-zinc-800 w-full resize-y"
              placeholder="Provide clear instructions for students..."
              onChange={(e) =>
                setAssignment({ ...assignment, instructions: e.target.value })
              }
              value={assignment.instructions || ""}
            />
          </div>

          <div className="mt-2 mb-4 flex items-center justify-between">
            <div>
              <label htmlFor="publishSwitch" className="mb-1.5 text-xs text-zinc-600 block">
                Publish Assignment
              </label>
              <p className="text-md text-gray-500 mt-1">
                Make this assignment visible to students
              </p>
            </div>
            <Switch
              id="publishSwitch"
              checked={assignment.isPublished || false}
              onChange={(e) =>
                setAssignment({
                  ...assignment,
                  isPublished: e.currentTarget.checked,
                  status: e.currentTarget.checked ? "published" : "draft",
                })
              }
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-1 text-[#52525c]">Due Date<span className="text-red-500 ml-0.5">*</span></p>
              <div className="relative">
                <input
                  id="dueDate"
                  type="date"
                  required
                  className="px-3 py-2.5 h-10 rounded border-solid border-[0.5px] border-zinc-500 text-zinc-800 w-full"
                  value={assignment.dueDate || ""}
                  onChange={(e) =>
                    setAssignment({ ...assignment, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <InputField
              className="!py-0"
              label="Max Score"
              type="number"
              min={1}
              placeholder="100"
              onChange={(e) =>
                setAssignment({
                  ...assignment,
                  maxScore: Number.parseInt(e.target.value) || 100,
                })
              }
              value={assignment.maxScore?.toString() || "100"}
            />
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={isConfirmDeleteOpen}
        busy={deleting}
        dialogTitle="Delete confirmation"
        saveButtonText="Delete Assignment"
        onClose={() => setIsConfirmDeleteOpen(false)}
        onSave={confirmDelete}
      >
        <div className="mt-4">
          <p>
            Are you sure you want to delete this assignment? The assignment will be
            removed permanently.
          </p>
        </div>
      </Dialog>
    </>
  );
};

