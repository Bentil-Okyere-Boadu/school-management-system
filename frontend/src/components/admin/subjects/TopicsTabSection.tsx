"use client";
import React, { useState } from "react";
import { Dialog } from "@/components/common/Dialog";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import { Menu, Select } from "@mantine/core";
import { IconDots, IconEdit, IconTrashFilled } from "@tabler/icons-react";
import { CurriculumItem, ErrorResponse, SubjectCatalog, Topic } from "@/@types";
import {
  useCreateTopic,
  useDeleteTopic,
  useEditTopic,
  useGetCurricula,
  useGetCurriculumById,
  useGetTopics,
} from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { HashLoader } from "react-spinners";

export const TopicsTabSection: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isCreate, setIsCreate] = useState(true);

  // Dialog selection state (moved here)
  const [dialogCurriculumId, setDialogCurriculumId] = useState<string>("");
  const [dialogSubjectId, setDialogSubjectId] = useState<string>("");
  const [topic, setTopic] = useState<Partial<Topic & { subjectCatalogId: string; curriculumId: string }>>({
    id: "",
    name: "",
    description: "",
    subjectCatalogId: "",
    curriculumId: "",
  });

  // Data sources
  const { curricula } = useGetCurricula();
  const curriculumOptions =
    (curricula as unknown as CurriculumItem[])?.map((c) => ({
      value: String(c.id),
      label: String(c.name),
    })) ?? [];

  const { curriculum } = useGetCurriculumById(dialogCurriculumId);
  const subjectOptions =
    (curriculum?.subjectCatalogs || [])?.map((s: SubjectCatalog) => ({
      value: String(s.id),
      label: String(s.name),
    })) ?? [];

  // List all topics (filters moved to dialog only)
  const { topics, isLoading, refetch } = useGetTopics();

  console.log(topics, "here");

  const onOpenCreate = () => {
    setIsCreate(true);
    setTopic({
      id: "",
      name: "",
      description: "",
      subjectCatalogId: "",
      curriculumId: "",
    });
    setDialogCurriculumId("");
    setDialogSubjectId("");
    setIsDialogOpen(true);
  };

  const onOpenEdit = (row: Topic) => {
    setIsCreate(false);
    setTopic({
      id: row.id,
      name: row.name,
      description: row.description,
      subjectCatalogId: "",
      curriculumId: "",
    });
    // We don't have the subject/curriculum on the row; user will pick them
    setDialogCurriculumId("");
    setDialogSubjectId("");
    setIsDialogOpen(true);
  };

  const onAskDelete = (row: Topic) => {
    setTopic({
      id: row.id,
      name: row.name,
    });
    setIsConfirmDeleteOpen(true);
  };

  const { mutate: createTopic, isPending: creating } = useCreateTopic();
  const { mutate: editTopic, isPending: editing } = useEditTopic(topic?.id || "");
  const { mutate: deleteTopic, isPending: deleting } = useDeleteTopic();

  const saveTopic = () => {
    if (!topic.name || !dialogCurriculumId || !dialogSubjectId) {
      toast.error("Name, curriculum and subject are required.");
      return;
    }
    const payload = {
      name: topic.name as string,
      description: topic.description as string,
      subjectCatalogId: dialogSubjectId,
      curriculumId: dialogCurriculumId,
    };
    if (isCreate) {
      createTopic(payload, {
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
      editTopic(payload, {
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
    <>
      <div className="pb-8">
        <h1 className="text-md font-semibold text-neutral-800 mb-2">Topics</h1>

        <div className="flex justify-end mb-4"><CustomButton text="Create Topic" onClick={onOpenCreate} /></div>

        <section className="bg-white mt-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                    <div>Name</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                    <div>Description</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                    <div>Curriculum</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                    <div>Subject</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (isLoading) {
                    return (
                      <tr>
                        <td colSpan={8}>
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
                        <td colSpan={8}>
                          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <p className="text-lg font-medium">No topics added</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Added topics will appear here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  type TopicRow = Topic & {
                    subjectCatalog?: { name?: string; curriculum?: { name?: string } };
                    curriculum?: { name?: string };
                    subject?: { name?: string };
                  };
                  return topics.map((row: TopicRow) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row.name}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row.description}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row?.curriculum?.name ?? row?.subjectCatalog?.curriculum?.name ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{row?.subjectCatalog?.name ?? row?.subject?.name ?? "-"}</div>
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
        busy={isCreate ? creating : editing}
        dialogTitle={isCreate ? "Create Topic" : "Edit Topic"}
        onClose={() => setIsDialogOpen(false)}
        onSave={saveTopic}
      >
        <form className="mt-3">
          <InputField
            className="!py-0"
            label="Name"
            min={1}
            placeholder="Eg. Algebra Basics"
            onChange={(e) => setTopic((p) => ({ ...p, name: e.target.value }))}
            value={topic.name || ""}
          />
          <InputField
            className="!py-0"
            label="Description"
            min={1}
            placeholder="Short summary"
            onChange={(e) => setTopic((p) => ({ ...p, description: e.target.value }))}
            value={topic.description || ""}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Curriculum"
              placeholder="Select curriculum"
              data={curriculumOptions}
              value={dialogCurriculumId}
              onChange={(v) => {
                setDialogCurriculumId(v as string);
                setDialogSubjectId("");
              }}
              searchable
            />
            <Select
              label="Subject"
              placeholder="Select subject (select curriculum first)"
              data={subjectOptions}
              value={dialogSubjectId}
              onChange={(v) => setDialogSubjectId(v as string)}
              searchable
              disabled={!dialogCurriculumId}
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
    </>
  );
};