"use client";
import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { Dialog } from "@/components/common/Dialog";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import { Topic, ErrorResponse } from "@/@types";
import { useGetTeacherTopics, useGetTeacherSubjects, useCreateTeacherTopic, useUpdateTeacherTopic, useDeleteTeacherTopic } from "@/hooks/teacher";
import { HashLoader } from "react-spinners";
import { Select, Menu } from "@mantine/core";
import { IconDots, IconEdit, IconTrashFilled } from "@tabler/icons-react";
import { toast } from "react-toastify";


export const TopicsTabSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isCreate, setIsCreate] = useState(true);
  const [topic, setTopic] = useState<Partial<Topic & { subjectCatalogId: string }>>({
    id: "",
    name: "",
    description: "",
    subjectCatalogId: "",
  });

  const { teacherTopics: topics, isLoading, refetch } = useGetTeacherTopics(searchQuery);
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
    });
    setIsDialogOpen(true);
  };

  const onOpenEdit = (row: Topic) => {
    setIsCreate(false);
    setTopic({
      id: row.id,
      name: row.name,
      description: row.description,
      subjectCatalogId: row.subjectCatalog?.id || "",
    });
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
    const payload = {
      name: topic.name || "",
      description: topic.description || "",
      subjectCatalogId: topic.subjectCatalogId || "",
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
      updateTopic(payload, {
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="pb-8">
      <h1 className="text-md font-semibold text-neutral-800 mb-2">My Topics</h1>

      <div className="w-full flex justify-between mb-4">
        {false  ? (        
          <SearchBar
            placeholder="Search topics..."
            onSearch={handleSearch}
            className="w-full max-w-md"
          />
        ) : (
          <div></div>
        )}
        <CustomButton text="Create Topic" onClick={onOpenCreate} />
      </div>

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
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (isLoading) {
                    return (
                      <tr>
                        <td colSpan={4}>
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
                        <td colSpan={4}>
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
            label="Subject"
            required
            placeholder="Select subject"
            data={subjectOptions}
            value={topic.subjectCatalogId}
            onChange={(v) => setTopic((p) => ({ ...p, subjectCatalogId: v || "" }))}
            searchable
          />
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

