"use client";
import React, { useState, useMemo } from "react";
import { Dialog } from "@/components/common/Dialog";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import { Topic, ErrorResponse, TeacherTopicPayload } from "@/@types";
import { useGetTeacherTopics, useGetTeacherSubjects, useCreateTeacherTopic, useUpdateTeacherTopic, useDeleteTeacherTopic, useTeacherAcademicTermSelection } from "@/hooks/teacher";
import { TeacherTermSelect } from "@/components/teacher/subjects/TeacherTermSelect";
import { buildTermSelectData } from "@/utils/schoolTerms";
import { HashLoader } from "react-spinners";
import { Badge, Combobox, Select, Menu } from "@mantine/core";
import { IconDots, IconEdit, IconTrashFilled } from "@tabler/icons-react";
import { toast } from "react-toastify";

function toDateInputValue(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "";
  const s = String(iso).trim();
  return s.length >= 10 ? s.slice(0, 10) : "";
}


export const TopicsTabSection: React.FC = () => {
  const {
    calendars,
    calendarsLoading,
    sortedTerms,
    academicTermId,
    setAcademicTermId,
  } = useTeacherAcademicTermSelection();

  const latestTermId = sortedTerms[0]?.id;

  const teacherTermSelectData = useMemo(
    () => buildTermSelectData(calendars ?? [], sortedTerms),
    [calendars, sortedTerms],
  );

  const termSelectRightSection = (termId: string) => (
    <div className="flex items-center justify-end gap-1.5 pr-0.5">
      {latestTermId && termId === latestTermId ? (
        <Badge
          variant="light"
          size="xs"
          className="shrink-0 font-semibold"
          style={{ backgroundColor: "#F3E8FF", color: "#6B21A8" }}
        >
          Latest
        </Badge>
      ) : null}
      <Combobox.Chevron size="sm" />
    </div>
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isCreate, setIsCreate] = useState(true);
  const [topic, setTopic] = useState<
    Partial<Topic & { subjectCatalogId: string; plannedStartDate: string; plannedEndDate: string }>
  >({
    id: "",
    name: "",
    description: "",
    subjectCatalogId: "",
    plannedStartDate: "",
    plannedEndDate: "",
  });
  const [dialogAcademicTermId, setDialogAcademicTermId] = useState("");

  const { teacherTopics: topics, isLoading, refetch } = useGetTeacherTopics(
    "",
    academicTermId,
  );
  const { teacherSubjects } = useGetTeacherSubjects("");
  const { mutate: createTopic, isPending: creating } = useCreateTeacherTopic();
  const { mutate: updateTopic, isPending: updating } = useUpdateTeacherTopic(topic?.id || "");
  const { mutate: deleteTopic, isPending: deleting } = useDeleteTeacherTopic();

  // Convert teacher subjects to select options
  const subjectOptions = teacherSubjects?.map((subject) => ({
    value: subject.id,
    label: subject.name,
  })) || [];

  const onOpenCreate = () => {
    setIsCreate(true);
    setTopic({
      id: "",
      name: "",
      description: "",
      subjectCatalogId: "",
      plannedStartDate: "",
      plannedEndDate: "",
    });
    setDialogAcademicTermId(
      academicTermId && sortedTerms.some((t) => t.id === academicTermId)
        ? academicTermId
        : sortedTerms[0]?.id ?? "",
    );
    setIsDialogOpen(true);
  };

  const onOpenEdit = (row: Topic) => {
    setIsCreate(false);
    setTopic({
      id: row.id,
      name: row.name,
      description: row.description,
      subjectCatalogId: row.subjectCatalog?.id || "",
      plannedStartDate: toDateInputValue(row.plannedStartDate),
      plannedEndDate: toDateInputValue(row.plannedEndDate),
    });
    setDialogAcademicTermId(
      row.academicTerm?.id ?? row.academicTermId ?? academicTermId ?? "",
    );
    setIsDialogOpen(true);
  };

  const onAskDelete = (row: Topic) => {
    setTopic({
      id: row.id,
      name: row.name,
    });
    setIsConfirmDeleteOpen(true);
  };

  const saveTopic = () => {
    const start = topic.plannedStartDate?.trim() ?? "";
    const end = topic.plannedEndDate?.trim() ?? "";
    if (isCreate && !dialogAcademicTermId) {
      toast.error("Select an academic term for this topic.");
      return;
    }
    if (
      isCreate &&
      !sortedTerms.some((t) => t.id === dialogAcademicTermId)
    ) {
      toast.error("Invalid academic term.");
      return;
    }
    const base: TeacherTopicPayload = {
      name: topic.name || "",
      description: (topic.description as string),
      subjectCatalogId: topic.subjectCatalogId || "",
      ...(isCreate && dialogAcademicTermId
        ? { academicTermId: dialogAcademicTermId }
        : {}),
      ...(isCreate
        ? {
            ...(start ? { plannedStartDate: start } : {}),
            ...(end ? { plannedEndDate: end } : {}),
          }
        : {
            plannedStartDate: start || null,
            plannedEndDate: end || null,
          }),
    };

    if (isCreate) {
      createTopic(base, {
        onSuccess: () => {
          toast.success("Topic created successfully");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    } else {
      updateTopic(base, {
        onSuccess: () => {
          toast.success("Topic updated successfully");
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
    deleteTopic(topic?.id as string, {
      onSuccess: () => {
        toast.success("Topic deleted successfully");
        setIsConfirmDeleteOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  };

  return (
    <div className="pb-8">

      <TeacherTermSelect
        calendars={calendars ?? []}
        calendarsLoading={calendarsLoading}
        sortedTerms={sortedTerms}
        academicTermId={academicTermId}
        setAcademicTermId={setAcademicTermId}
        actions={
          <CustomButton text="Create Topic" onClick={onOpenCreate} />
        }
      />

      <section className="bg-white mt-2">
        <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                    <div>Topic Name</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                    <div>Description</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-center max-md:px-5 max-w-[150px]">
                    <div>Subject</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 whitespace-nowrap">
                    <div>Planned start</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 whitespace-nowrap">
                    <div>Planned end</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-center max-md:px-5 max-w-[120px]">
                    <div>Created By</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-right max-md:px-5 max-w-[80px] pr-10">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (!calendarsLoading && !sortedTerms.length) {
                    return (
                      <tr>
                        <td colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <p className="text-lg font-medium">No academic terms</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Your school has no terms in its calendars yet.
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (!academicTermId) {
                    return (
                      <tr>
                        <td colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <p className="text-lg font-medium">Select a term</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Choose an academic term above to load topics.
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  }

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

                  if (!topics?.length) {
                    return (
                      <tr>
                        <td colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <p className="text-lg font-medium">No topics assigned</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Topics assigned to you will appear here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  type TopicRow = Topic & {
                    subjectCatalog?: { id?: string; name?: string; curriculum?: { name?: string } };
                    curriculum?: { name?: string };
                    subject?: { name?: string };
                    createdBy?: string;
                  };
                  return topics.map((row: TopicRow) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row.name}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row.description || "-"}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div className="flex items-center justify-center">
                          {row.subjectCatalog?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5 whitespace-nowrap text-sm text-gray-800">
                        {row.plannedStartDate}
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5 whitespace-nowrap text-sm text-gray-800">
                        {row.plannedEndDate}
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div className="flex items-center justify-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.createdBy === "admin" 
                              ? "bg-red-100 text-red-700" 
                              : "bg-green-100 text-green-700"
                          }`}>
                            {row.createdBy === "admin" ? "Admin" : "Teacher"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div className="flex items-center justify-end pr-6">
                          {row.createdBy !== "admin" && (
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
                          )}
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </section>

      <Dialog
        isOpen={isDialogOpen}
        busy={isCreate ? creating : updating}
        dialogTitle={isCreate ? "Create Topic" : "Edit Topic"}
        onClose={() => setIsDialogOpen(false)}
        onSave={saveTopic}
      >
        <form className="mt-3">
          <InputField
            className="!py-0"
            label="Name"
            required
            placeholder="Eg. Algebra Basics"
            onChange={(e) => setTopic((p) => ({ ...p, name: e.target.value }))}
            value={topic.name || ""}
          />
          <InputField
            className="!py-0"
            label="Description"
            placeholder="Introduction to algebraic expressions"
            onChange={(e) => setTopic((p) => ({ ...p, description: e.target.value }))}
            value={topic.description || ""}
          />
          <Select
            className="mt-4"
            label="Academic term"
            placeholder={
              calendarsLoading
                ? "Loading terms…"
                : sortedTerms.length === 0
                  ? "No terms configured"
                  : "Select term"
            }
            data={teacherTermSelectData}
            value={dialogAcademicTermId}
            onChange={(v) => setDialogAcademicTermId(v ?? "")}
            searchable
            disabled={
              !isCreate || calendarsLoading || sortedTerms.length === 0
            }
            description={
              isCreate
                ? undefined
                : "Term cannot be changed when editing a topic."
            }
            rightSection={termSelectRightSection(dialogAcademicTermId)}
            rightSectionWidth={
              latestTermId && dialogAcademicTermId === latestTermId
                ? 118
                : undefined
            }
          />
          <Select
            label="Subject"
            required
            placeholder="Select subject"
            data={subjectOptions}
            value={topic.subjectCatalogId}
            onChange={(v) => setTopic((p) => ({ ...p, subjectCatalogId: v || "" }))}
            searchable
          />
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <InputField
              className="!py-0"
              type="date"
              label="Planned start"
              value={topic.plannedStartDate ?? ""}
              onChange={(e) =>
                setTopic((p) => ({
                  ...p,
                  plannedStartDate: e.target.value,
                }))
              }
            />
            <InputField
              className="!py-0"
              type="date"
              label="Planned end"
              value={topic.plannedEndDate ?? ""}
              onChange={(e) =>
                setTopic((p) => ({
                  ...p,
                  plannedEndDate: e.target.value,
                }))
              }
            />
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={isConfirmDeleteOpen}
        busy={deleting}
        dialogTitle="Delete confirmation"
        saveButtonText="Delete Topic"
        onClose={() => setIsConfirmDeleteOpen(false)}
        onSave={confirmDelete}
      >
        <div className="mt-4">
          <p>
            Are you sure you want to delete this topic? The topic will be removed permanently.
          </p>
        </div>
      </Dialog>
    </div>
  );
};

