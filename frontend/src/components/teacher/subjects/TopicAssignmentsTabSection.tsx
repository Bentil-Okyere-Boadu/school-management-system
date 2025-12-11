"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/common/Dialog";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import { SearchBar } from "@/components/common/SearchBar";
import { Menu, Select, Switch } from "@mantine/core";
import { IconDots, IconEdit, IconTrashFilled, IconClipboardCheck } from "@tabler/icons-react";
import { Topic, Assignment, ErrorResponse } from "@/@types";
import { AttachmentIcon } from "@/utils/icons";
import FileUploadArea from "@/components/common/FileUploadArea";
import { useGetTeacherTopics, useGetTeacherAssignments, useCreateTeacherAssignment, useUpdateTeacherAssignment, useDeleteTeacherAssignment, useGetTeacherSubjectClasses } from "@/hooks/teacher";
import { toast } from "react-toastify";
import { HashLoader } from "react-spinners";


export const TopicAssignmentsTabSection: React.FC = () => {
  const router = useRouter();
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
    assignmentType: "online",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
      assignmentType: "online",
    });
    setSelectedFiles([]);
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
      assignmentType: row.assignmentType || "online",
      attachmentPath: row.attachmentPath,
      attachmentUrl: row.attachmentUrl,
      attachmentMediaType: row.attachmentMediaType,
    });
    setSelectedFiles([]);
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
      const formData = new FormData();
      formData.append('topicId', assignment.topicId || "");
      formData.append('classLevelId', assignment.classLevelId || "");
      formData.append('title', assignment.title || "");
      formData.append('instructions', assignment.instructions || "");
      formData.append('dueDate', assignment.dueDate || "");
      formData.append('maxScore', String(assignment.maxScore || 100));
      formData.append('state', assignment.isPublished ? "published" : "draft");
      formData.append('assignmentType', assignment.assignmentType || "online");
      
      if (selectedFiles.length > 0) {
        formData.append('file', selectedFiles[0]);
      }
      
      createAssignment(formData, {
        onSuccess: () => {
          toast.success("Assignment created successfully");
          setIsDialogOpen(false);
          setSelectedFiles([]);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    } else {
      const formData = new FormData();
      formData.append('title', assignment.title || "");
      formData.append('instructions', assignment.instructions || "");
      if (assignment.dueDate) formData.append('dueDate', assignment.dueDate);
      if (assignment.maxScore) formData.append('maxScore', String(assignment.maxScore));
      formData.append('state', assignment.isPublished ? "published" : "draft");
      formData.append('assignmentType', assignment.assignmentType || "online");
      
      if (selectedFiles.length > 0) {
        formData.append('file', selectedFiles[0]);
      }
      
      updateAssignment(formData, {
        onSuccess: () => {
          toast.success("Assignment updated successfully");
          setIsDialogOpen(false);
          setSelectedFiles([]);
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
                    <div>Class</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                    <div>Type</div>
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
                        <td colSpan={9}>
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
                        <td colSpan={9}>
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
                        <div className="flex flex-row gap-2">
                          <div className="flex justify-center">
                            {row.attachmentPath && (
                              <a 
                                href={row.attachmentUrl || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"
                                title="View attachment"
                              >
                                <AttachmentIcon />
                              </a>
                            )}
                          </div>
                          {row.title}
                      </div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row.topic || "-"}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row.class || "-"}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (row.assignmentType || "online") === "online"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {(row.assignmentType || "online") === "online" ? "Online" : "Offline"}
                        </span>
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
                                onClick={() => router.push(`/teacher/assignments/${row.id}/grading`)}
                                leftSection={<IconClipboardCheck size={18} color="#AB58E7" />}
                              >
                                Go to grading
                              </Menu.Item>
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

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-1">
              <Select
                label="Assignment Type"
                placeholder="Select assignment type"
                data={[
                  { value: "online", label: "Online" },
                  { value: "offline", label: "Offline" }
                ]}
                value={assignment.assignmentType}
                onChange={(v) => setAssignment({ ...assignment, assignmentType: v as "online" | "offline" || "online" })}
                required
              />
            </div>
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

          {assignment.assignmentType === "online" && (
            <div className="mb-4">
              <div className="mb-1.5 text-xs text-zinc-600">
                Attachment (Optional)
              </div>
              
              {/* Show existing file indication when editing */}
              {!isCreate && assignment.attachmentPath && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-800 font-medium">
                        Current file: {assignment.attachmentPath?.split('/').pop()}
                      </span>
                    </div>
                    {assignment.attachmentUrl && (
                      <a 
                        href={assignment.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        View file
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Upload a new file below to replace the current one
                  </p>
                </div>
              )}
              
              <FileUploadArea 
                onFileSelect={setSelectedFiles} 
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" 
              />
              {selectedFiles.length > 0 && (
                <div className="mt-2 text-sm text-gray-700">
                  Selected: <strong>{selectedFiles.map(f => f.name).join(', ')}</strong>
                </div>
              )}
            </div>
          )}

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

